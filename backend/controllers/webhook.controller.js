const asyncHandler = require('../utils/asyncHandler');
const Webhook = require('../models/Webhook');
const WebhookDelivery = require('../models/WebhookDelivery');
const webhookService = require('../services/webhook.service');
const settingsEncryptionService = require('../services/settingsEncryption.service');
const integrationActivityService = require('../services/integrationActivity.service');
const { deliverWebhook } = require('../services/webhookDelivery.service');
const { WEBHOOK_EVENTS } = require('../services/webhookEvent.service');
const crypto = require('crypto');

const getWid = (req) => req.params.wid || req.query.workspace || req.body.workspace || req.workspace?._id;

// ─────────────────────────────────────────────
// GET /api/workspaces/:wid/webhooks
// ─────────────────────────────────────────────
const list = asyncHandler(async (req, res) => {
  const workspace = getWid(req);
  const query = { workspace };
  if (req.query.status) query.status = req.query.status;
  if (req.query.event) query.events = req.query.event;

  const items = await Webhook.find(query)
    .populate('createdBy', 'name email avatar')
    .sort({ createdAt: -1 });

  // Remove encrypted secrets from response
  const safe = items.map((w) => {
    const obj = w.toObject();
    delete obj.secretEncrypted;
    if (obj.headers) obj.headers = obj.headers.map((h) => ({ key: h.key }));
    return obj;
  });

  res.json({ success: true, data: safe, webhooks: safe });
});

// ─────────────────────────────────────────────
// POST /api/workspaces/:wid/webhooks
// ─────────────────────────────────────────────
const create = asyncHandler(async (req, res) => {
  const workspace = getWid(req);
  const { name, description, url, events = [], secret, headers = [], retryPolicy, timeoutSeconds } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, message: 'Webhook URL is required' });
  }

  if (!url.startsWith('https://') && process.env.NODE_ENV === 'production') {
    return res.status(400).json({ success: false, message: 'Webhook URL must use HTTPS' });
  }

  if (webhookService.isPrivateUrl(url) && process.env.NODE_ENV === 'production') {
    return res.status(400).json({ success: false, message: 'Private/localhost URLs are not allowed' });
  }

  const webhookSecret = secret || webhookService.generateSecret();
  const encryptedHeaders = (headers || []).map((h) => ({
    key: h.key,
    valueEncrypted: h.value ? settingsEncryptionService.encrypt(h.value) : undefined,
  }));

  const webhook = await Webhook.create({
    workspace,
    name,
    description,
    url,
    events,
    secretEncrypted: settingsEncryptionService.encrypt(webhookSecret),
    headers: encryptedHeaders,
    retryPolicy,
    timeoutSeconds,
    status: 'active',
    createdBy: req.user?._id,
  });

  await integrationActivityService.log({
    workspace,
    module: 'webhooks',
    action: 'webhook_created',
    refModel: 'Webhook',
    refId: webhook._id,
    description: `Webhook "${name}" created`,
    performedBy: req.user?._id,
    ipAddress: req.ip,
  });

  const safe = webhook.toObject();
  delete safe.secretEncrypted;
  safe.headers = safe.headers.map((h) => ({ key: h.key }));

  res.status(201).json({
    success: true,
    message: 'Webhook created successfully',
    data: safe,
  });
});

// ─────────────────────────────────────────────
// GET /api/workspaces/:wid/webhooks/:webhookId
// ─────────────────────────────────────────────
const getById = asyncHandler(async (req, res) => {
  const item = await Webhook.findOne({
    _id: req.params.webhookId,
    workspace: getWid(req),
  }).populate('createdBy', 'name email avatar');

  if (!item) {
    return res.status(404).json({ success: false, message: 'Webhook not found' });
  }

  const safe = item.toObject();
  delete safe.secretEncrypted;
  if (safe.headers) safe.headers = safe.headers.map((h) => ({ key: h.key }));

  res.json({ success: true, data: safe });
});

// ─────────────────────────────────────────────
// PUT /api/workspaces/:wid/webhooks/:webhookId
// ─────────────────────────────────────────────
const update = asyncHandler(async (req, res) => {
  const workspace = getWid(req);
  const webhook = await Webhook.findOne({ _id: req.params.webhookId, workspace });

  if (!webhook) {
    return res.status(404).json({ success: false, message: 'Webhook not found' });
  }

  const { name, description, url, events, secret, headers, retryPolicy, timeoutSeconds } = req.body;

  if (url) {
    if (!url.startsWith('https://') && process.env.NODE_ENV === 'production') {
      return res.status(400).json({ success: false, message: 'Webhook URL must use HTTPS' });
    }
    webhook.url = url;
  }
  if (name !== undefined) webhook.name = name;
  if (description !== undefined) webhook.description = description;
  if (events !== undefined) webhook.events = events;
  if (secret) webhook.secretEncrypted = settingsEncryptionService.encrypt(secret);
  if (headers !== undefined) {
    webhook.headers = (headers || []).map((h) => ({
      key: h.key,
      valueEncrypted: h.value ? settingsEncryptionService.encrypt(h.value) : undefined,
    }));
  }
  if (retryPolicy !== undefined) webhook.retryPolicy = retryPolicy;
  if (timeoutSeconds !== undefined) webhook.timeoutSeconds = timeoutSeconds;
  webhook.updatedBy = req.user?._id;

  await webhook.save();

  await integrationActivityService.log({
    workspace,
    module: 'webhooks',
    action: 'webhook_updated',
    refModel: 'Webhook',
    refId: webhook._id,
    description: `Webhook "${webhook.name}" updated`,
    performedBy: req.user?._id,
    ipAddress: req.ip,
  });

  const safe = webhook.toObject();
  delete safe.secretEncrypted;
  if (safe.headers) safe.headers = safe.headers.map((h) => ({ key: h.key }));

  res.json({ success: true, data: safe });
});

// ─────────────────────────────────────────────
// DELETE /api/workspaces/:wid/webhooks/:webhookId
// ─────────────────────────────────────────────
const remove = asyncHandler(async (req, res) => {
  const workspace = getWid(req);
  const item = await Webhook.findOneAndDelete({ _id: req.params.webhookId, workspace });

  if (!item) {
    return res.status(404).json({ success: false, message: 'Webhook not found' });
  }

  await integrationActivityService.log({
    workspace,
    module: 'webhooks',
    action: 'webhook_deleted',
    refModel: 'Webhook',
    refId: item._id,
    description: `Webhook "${item.name}" deleted`,
    performedBy: req.user?._id,
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Webhook deleted' });
});

// ─────────────────────────────────────────────
// POST /api/workspaces/:wid/webhooks/:webhookId/test
// ─────────────────────────────────────────────
const test = asyncHandler(async (req, res) => {
  const workspace = getWid(req);
  const webhook = await Webhook.findOne({ _id: req.params.webhookId, workspace });

  if (!webhook) {
    return res.status(404).json({ success: false, message: 'Webhook not found' });
  }

  const eventId = `evt_test_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const testPayload = {
    id: eventId,
    event: 'webhook.test',
    workspaceId: workspace.toString(),
    timestamp: new Date().toISOString(),
    data: { message: 'This is a test webhook from ONEPWS.' },
    metadata: { source: 'onepws', test: true },
  };

  const delivery = await WebhookDelivery.create({
    workspace,
    webhook: webhook._id,
    event: 'webhook.test',
    eventId,
    payload: testPayload,
    url: webhook.url,
    status: 'pending',
    attempt: 1,
    maxAttempts: 1,
  });

  try {
    await deliverWebhook({ webhook, delivery });

    await delivery.reload?.() || (await delivery.constructor.findById(delivery._id).then((d) => Object.assign(delivery, d)));

    const updated = await WebhookDelivery.findById(delivery._id);

    await integrationActivityService.log({
      workspace,
      module: 'webhooks',
      action: 'webhook_test_sent',
      refModel: 'Webhook',
      refId: webhook._id,
      description: `Test webhook sent for "${webhook.name}"`,
      metadata: { responseStatus: updated?.responseStatus },
      performedBy: req.user?._id,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: updated?.status === 'success' ? 'Webhook test delivered successfully' : 'Webhook test sent but delivery failed',
      data: {
        deliveryId: delivery._id,
        status: updated?.status,
        responseStatus: updated?.responseStatus,
        responseTimeMs: updated?.responseTimeMs,
        errorMessage: updated?.errorMessage,
      },
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: 'Webhook test failed',
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/workspaces/:wid/webhooks/:webhookId/enable
// PATCH /api/workspaces/:wid/webhooks/:webhookId/disable
// PATCH /api/workspaces/:wid/webhooks/:webhookId/pause
// ─────────────────────────────────────────────
const setStatus = (status, action) =>
  asyncHandler(async (req, res) => {
    const workspace = getWid(req);
    const item = await Webhook.findOneAndUpdate(
      { _id: req.params.webhookId, workspace },
      { status, updatedBy: req.user?._id },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Webhook not found' });
    }

    await integrationActivityService.log({
      workspace,
      module: 'webhooks',
      action,
      refModel: 'Webhook',
      refId: item._id,
      description: `Webhook "${item.name}" ${status}`,
      performedBy: req.user?._id,
      ipAddress: req.ip,
    });

    const safe = item.toObject();
    delete safe.secretEncrypted;
    res.json({ success: true, data: safe });
  });

// ─────────────────────────────────────────────
// GET /api/workspaces/:wid/webhooks/:webhookId/deliveries
// ─────────────────────────────────────────────
const getDeliveries = asyncHandler(async (req, res) => {
  const workspace = getWid(req);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const skip = (page - 1) * limit;

  const query = { workspace, webhook: req.params.webhookId };
  if (req.query.status) query.status = req.query.status;
  if (req.query.event) query.event = req.query.event;

  const [items, total] = await Promise.all([
    WebhookDelivery.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    WebhookDelivery.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// ─────────────────────────────────────────────
// GET /api/workspaces/:wid/developer/event-catalog
// ─────────────────────────────────────────────
const getEventCatalog = asyncHandler(async (req, res) => {
  const EVENT_GROUPS = {
    Tasks: ['task.created', 'task.updated', 'task.assigned', 'task.stage_changed', 'task.completed', 'task.overdue', 'task.commented'],
    Projects: ['project.created', 'project.updated', 'project.assigned', 'project.completed'],
    Approvals: ['approval.created', 'approval.approved', 'approval.rejected', 'approval.changes_requested', 'approval.completed'],
    Finance: ['budget.created', 'budget.approved', 'budget.rejected', 'budget.threshold_reached', 'expense.created', 'expense.approved', 'expense.rejected', 'expense.paid'],
    'Meetings & MOM': ['meeting.scheduled', 'meeting.updated', 'meeting.cancelled', 'mom.created', 'mom.signed', 'mom.action_point_created', 'mom.action_point_completed'],
    SLA: ['sla.breached', 'sla.deadline_approaching', 'sla.t0_confirmed'],
    Campaigns: ['campaign.created', 'campaign.started', 'campaign.completed', 'content.created', 'content.approved', 'content.scheduled', 'content.published'],
    Vendors: ['vendor.created', 'vendor.approved', 'vendor.rejected', 'vendor.blacklisted', 'vendor.contract_expiring'],
    'Print Jobs': ['print_job.created', 'print_job.artwork_approved', 'print_job.sent_to_vendor', 'print_job.proof_approved', 'print_job.dispatched', 'print_job.delivered', 'print_job.completed', 'print_job.reprint_required'],
    Timesheets: ['timesheet.submitted', 'timesheet.approved', 'timesheet.rejected'],
    Wiki: ['wiki.article_published', 'wiki.article_needs_update'],
    Employees: ['employee.created', 'employee.role_changed', 'employee.deactivated'],
  };

  res.json({ success: true, data: { groups: EVENT_GROUPS, all: WEBHOOK_EVENTS } });
});

module.exports = {
  list,
  getAll: list,
  create,
  getById,
  update,
  remove,
  delete: remove,
  test,
  enable: setStatus('active', 'webhook_enabled'),
  disable: setStatus('disabled', 'webhook_disabled'),
  pause: setStatus('paused', 'webhook_paused'),
  getDeliveries,
  getEventCatalog,
};
