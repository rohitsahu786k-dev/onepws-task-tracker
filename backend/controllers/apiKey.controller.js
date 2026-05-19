const asyncHandler = require('../utils/asyncHandler');
const APIKey = require('../models/APIKey');
const APIKeyUsageLog = require('../models/APIKeyUsageLog');
const apiKeyService = require('../services/apiKey.service');
const integrationActivityService = require('../services/integrationActivity.service');

const getWid = (req) => req.params.wid || req.query.workspace || req.body.workspace;

// ─────────────────────────────────────────────
// GET /api/workspaces/:wid/api-keys
// ─────────────────────────────────────────────
const getAll = asyncHandler(async (req, res) => {
  const workspace = getWid(req);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const skip = (page - 1) * limit;

  const query = { workspace };
  if (req.query.status) query.status = req.query.status;
  if (req.query.environment) query.environment = req.query.environment;
  if (req.query.search) {
    query.$or = [
      { name: new RegExp(req.query.search, 'i') },
      { keyPrefix: new RegExp(req.query.search, 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    APIKey.find(query)
      .select('-keyHash')
      .populate('createdBy', 'name email avatar')
      .populate('revokedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    APIKey.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: items,
    apiKeys: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// ─────────────────────────────────────────────
// POST /api/workspaces/:wid/api-keys
// ─────────────────────────────────────────────
const create = asyncHandler(async (req, res) => {
  const workspace = getWid(req);
  const {
    name,
    description,
    environment = 'live',
    permissions = [],
    allowedIps = [],
    expiresAt,
    rateLimit,
  } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'API key name is required' });
  }

  const rawKey = apiKeyService.generateApiKey(environment);
  const keyHash = apiKeyService.hashApiKey(rawKey);
  const keyPrefix = apiKeyService.getKeyPrefix(rawKey);

  const apiKey = await APIKey.create({
    workspace,
    name,
    description,
    environment,
    keyPrefix,
    keyHash,
    permissions,
    allowedIps,
    expiresAt: expiresAt || undefined,
    rateLimit: rateLimit || undefined,
    status: 'active',
    createdBy: req.user?._id,
  });

  await integrationActivityService.log({
    workspace,
    module: 'api_keys',
    action: 'api_key_created',
    refModel: 'APIKey',
    refId: apiKey._id,
    description: `API key "${name}" created`,
    performedBy: req.user?._id,
    ipAddress: req.ip,
  });

  const safeKey = apiKey.toObject();
  delete safeKey.keyHash;

  return res.status(201).json({
    success: true,
    message: 'API key created successfully',
    data: {
      ...safeKey,
      apiKey: rawKey,
      note: 'Copy this API key now. It will not be shown again.',
    },
  });
});

// ─────────────────────────────────────────────
// GET /api/workspaces/:wid/api-keys/:keyId
// ─────────────────────────────────────────────
const getById = asyncHandler(async (req, res) => {
  const item = await APIKey.findOne({
    _id: req.params.keyId,
    workspace: getWid(req),
  })
    .select('-keyHash')
    .populate('createdBy', 'name email avatar')
    .populate('revokedBy', 'name email');

  if (!item) {
    return res.status(404).json({ success: false, message: 'API key not found' });
  }

  res.json({ success: true, data: item });
});

// ─────────────────────────────────────────────
// PUT /api/workspaces/:wid/api-keys/:keyId
// ─────────────────────────────────────────────
const update = asyncHandler(async (req, res) => {
  const workspace = getWid(req);

  // Prevent sensitive field updates
  const allowed = ['name', 'description', 'permissions', 'allowedIps', 'expiresAt', 'rateLimit'];
  const patch = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) patch[key] = req.body[key];
  }
  patch.updatedBy = req.user?._id;

  const item = await APIKey.findOneAndUpdate(
    { _id: req.params.keyId, workspace },
    patch,
    { new: true, runValidators: true }
  ).select('-keyHash');

  if (!item) {
    return res.status(404).json({ success: false, message: 'API key not found' });
  }

  await integrationActivityService.log({
    workspace,
    module: 'api_keys',
    action: 'api_key_updated',
    refModel: 'APIKey',
    refId: item._id,
    description: `API key "${item.name}" updated`,
    performedBy: req.user?._id,
    ipAddress: req.ip,
  });

  res.json({ success: true, data: item });
});

// ─────────────────────────────────────────────
// PATCH /api/workspaces/:wid/api-keys/:keyId/disable
// ─────────────────────────────────────────────
const disable = asyncHandler(async (req, res) => {
  const workspace = getWid(req);
  const item = await APIKey.findOneAndUpdate(
    { _id: req.params.keyId, workspace, status: 'active' },
    { status: 'disabled', updatedBy: req.user?._id },
    { new: true }
  ).select('-keyHash');

  if (!item) {
    return res.status(404).json({ success: false, message: 'API key not found or not active' });
  }

  await integrationActivityService.log({
    workspace,
    module: 'api_keys',
    action: 'api_key_disabled',
    refModel: 'APIKey',
    refId: item._id,
    description: `API key "${item.name}" disabled`,
    performedBy: req.user?._id,
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'API key disabled', data: item });
});

// ─────────────────────────────────────────────
// PATCH /api/workspaces/:wid/api-keys/:keyId/revoke
// ─────────────────────────────────────────────
const revoke = asyncHandler(async (req, res) => {
  const workspace = getWid(req);
  const item = await APIKey.findOne({ _id: req.params.keyId, workspace });

  if (!item) {
    return res.status(404).json({ success: false, message: 'API key not found' });
  }

  if (item.status === 'revoked') {
    return res.status(400).json({ success: false, message: 'API key is already revoked' });
  }

  item.status = 'revoked';
  item.revokedAt = new Date();
  item.revokedBy = req.user?._id;
  item.revokeReason = req.body.reason || '';
  await item.save();

  await integrationActivityService.log({
    workspace,
    module: 'api_keys',
    action: 'api_key_revoked',
    refModel: 'APIKey',
    refId: item._id,
    description: `API key "${item.name}" revoked`,
    metadata: { reason: item.revokeReason },
    performedBy: req.user?._id,
    ipAddress: req.ip,
  });

  const safe = item.toObject();
  delete safe.keyHash;
  res.json({ success: true, message: 'API key revoked successfully', data: safe });
});

// ─────────────────────────────────────────────
// DELETE /api/workspaces/:wid/api-keys/:keyId
// ─────────────────────────────────────────────
const remove = asyncHandler(async (req, res) => {
  const workspace = getWid(req);
  const item = await APIKey.findOne({ _id: req.params.keyId, workspace });

  if (!item) {
    return res.status(404).json({ success: false, message: 'API key not found' });
  }

  // Prefer soft-delete (revoke) over hard delete
  item.status = 'revoked';
  item.revokedAt = new Date();
  item.revokedBy = req.user?._id;
  item.revokeReason = 'Deleted by admin';
  await item.save();

  await integrationActivityService.log({
    workspace,
    module: 'api_keys',
    action: 'api_key_deleted',
    refModel: 'APIKey',
    refId: item._id,
    description: `API key "${item.name}" deleted`,
    performedBy: req.user?._id,
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'API key deleted (revoked)' });
});

// ─────────────────────────────────────────────
// GET /api/workspaces/:wid/api-keys/:keyId/usage
// ─────────────────────────────────────────────
const getUsage = asyncHandler(async (req, res) => {
  const workspace = getWid(req);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const skip = (page - 1) * limit;

  const query = { workspace, apiKey: req.params.keyId };
  if (req.query.statusCode) query.statusCode = Number(req.query.statusCode);

  const [items, total] = await Promise.all([
    APIKeyUsageLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    APIKeyUsageLog.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// ─────────────────────────────────────────────
// POST /api/workspaces/:wid/api-keys/:keyId/duplicate
// ─────────────────────────────────────────────
const duplicate = asyncHandler(async (req, res) => {
  const workspace = getWid(req);
  const source = await APIKey.findOne({ _id: req.params.keyId, workspace });

  if (!source) {
    return res.status(404).json({ success: false, message: 'API key not found' });
  }

  const environment = req.body.environment || source.environment || 'live';
  const rawKey = apiKeyService.generateApiKey(environment);
  const keyHash = apiKeyService.hashApiKey(rawKey);
  const keyPrefix = apiKeyService.getKeyPrefix(rawKey);

  const newKey = await APIKey.create({
    workspace,
    name: req.body.name || `${source.name} (copy)`,
    description: source.description,
    environment,
    keyPrefix,
    keyHash,
    permissions: source.permissions,
    allowedIps: source.allowedIps,
    expiresAt: req.body.expiresAt,
    rateLimit: source.rateLimit,
    status: 'active',
    createdBy: req.user?._id,
  });

  await integrationActivityService.log({
    workspace,
    module: 'api_keys',
    action: 'api_key_duplicated',
    refModel: 'APIKey',
    refId: newKey._id,
    description: `API key "${newKey.name}" duplicated from "${source.name}"`,
    performedBy: req.user?._id,
    ipAddress: req.ip,
  });

  const safe = newKey.toObject();
  delete safe.keyHash;

  res.status(201).json({
    success: true,
    message: 'API key duplicated successfully',
    data: { ...safe, apiKey: rawKey, note: 'Copy this API key now. It will not be shown again.' },
  });
});

module.exports = {
  getAll,
  list: getAll,
  create,
  getById,
  update,
  disable,
  revoke,
  remove,
  delete: remove,
  getUsage,
  duplicate,
};
