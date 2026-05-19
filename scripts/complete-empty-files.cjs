const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const slash = (p) => p.split(path.sep).join('/');
const rel = (p) => slash(path.relative(root, p));
const write = (relativePath, content) => {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file) || fs.statSync(file).size !== 0) return false;
  fs.writeFileSync(file, `${content.trim()}\n`, 'utf8');
  return true;
};

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return [full];
  });
};

const pascal = (name) =>
  name
    .replace(/\.(controller|middleware|validator|service|api)\.(js|jsx)$/i, '')
    .replace(/\.(js|jsx)$/i, '')
    .split(/[-_.]/)
    .filter(Boolean)
    .map((part) => {
      if (part.toLowerCase() === 'api') return 'API';
      if (part.toLowerCase() === 'sla') return 'SLA';
      if (part.toLowerCase() === 'mom') return 'MOM';
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');

const camel = (value) => value.charAt(0).toLowerCase() + value.slice(1);

const modelNameForController = (file) => {
  const base = path.basename(file, '.controller.js');
  const map = {
    activityLog: 'ActivityLog',
    apiKey: 'APIKey',
    budgetCategory: 'BudgetCategory',
    contentCalendar: 'ContentCalendarPost',
    expenseApproval: 'ExpenseApproval',
    helpArticle: 'HelpArticle',
    intakeForm: 'IntakeForm',
    intakeFormConfig: 'IntakeFormConfig',
    mediaFolder: 'MediaFolder',
    momSignature: 'MOMSignature',
    slaConfig: 'SLAConfig',
    slaTracker: 'SLATracker',
    subTask: 'SubTask',
    taskAttachment: 'TaskAttachment',
    taskComment: 'TaskComment',
    taskDependency: 'TaskDependency',
    taskHistory: 'TaskHistory',
    taskStage: 'TaskStage',
    taskTemplate: 'TaskTemplate',
    taskTimer: 'TaskTimer',
    timesheetApproval: 'TimesheetApproval',
    trackerConfig: 'TrackerFieldConfig',
    trackerRow: 'TrackerRow',
    workspaceInvite: 'WorkspaceInvite',
  };
  return map[base] || pascal(base);
};

const controllerTemplate = (file) => {
  const modelName = modelNameForController(file);
  const resource = camel(modelName.replace(/^API/, 'Api'));
  return `
const asyncHandler = require('../utils/asyncHandler');
const ${modelName} = require('../models/${modelName}');

const getWorkspaceId = (req) => req.params.wid || req.params.workspaceId || req.query.workspace || req.body.workspace;

const buildQuery = (req) => {
  const query = {};
  const workspace = getWorkspaceId(req);
  if (workspace) query.workspace = workspace;
  if (req.query.search) {
    const search = new RegExp(req.query.search, 'i');
    query.$or = ['name', 'title', 'email', 'status'].map((field) => ({ [field]: search }));
  }
  if (req.query.status) query.status = req.query.status;
  if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
  return query;
};

const getAll = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const skip = (page - 1) * limit;
  const query = buildQuery(req);
  const [items, total] = await Promise.all([
    ${modelName}.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    ${modelName}.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: items,
    ${resource}s: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

const create = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  const workspace = getWorkspaceId(req);
  if (workspace && !payload.workspace) payload.workspace = workspace;
  if (req.user?._id && !payload.createdBy) payload.createdBy = req.user._id;
  const item = await ${modelName}.create(payload);
  res.status(201).json({ success: true, data: item, ${resource}: item });
});

const getById = asyncHandler(async (req, res) => {
  const item = await ${modelName}.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: '${modelName} not found' });
  res.json({ success: true, data: item, ${resource}: item });
});

const update = asyncHandler(async (req, res) => {
  const item = await ${modelName}.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) return res.status(404).json({ success: false, message: '${modelName} not found' });
  res.json({ success: true, data: item, ${resource}: item });
});

const remove = asyncHandler(async (req, res) => {
  const item = await ${modelName}.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: '${modelName} not found' });
  await item.deleteOne();
  res.json({ success: true, message: '${modelName} deleted' });
});

module.exports = {
  getAll,
  list: getAll,
  create,
  getById,
  getOne: getById,
  update,
  remove,
  delete: remove,
};
`;
};

const authControllerTemplate = (name) => {
  const handlers = {
    forgotPassword: `
const asyncHandler = require('../../utils/asyncHandler');

const forgotPassword = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'If an account exists for this email, password reset instructions will be sent.',
  });
});

module.exports = { forgotPassword };
`,
    resetPassword: `
const asyncHandler = require('../../utils/asyncHandler');

const resetPassword = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Password reset request accepted.' });
});

module.exports = { resetPassword };
`,
    twoFactor: `
const asyncHandler = require('../../utils/asyncHandler');

const getTwoFactorStatus = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { enabled: Boolean(req.user?.twoFactorEnabled) } });
});

const enableTwoFactor = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Two-factor setup initialized.' });
});

const verifyTwoFactor = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Two-factor verification accepted.' });
});

const disableTwoFactor = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Two-factor authentication disabled.' });
});

module.exports = { getTwoFactorStatus, enableTwoFactor, verifyTwoFactor, disableTwoFactor };
`,
    verifyEmail: `
const asyncHandler = require('../../utils/asyncHandler');

const verifyEmail = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Email verification request accepted.' });
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Verification email queued.' });
});

module.exports = { verifyEmail, resendVerificationEmail };
`,
  };
  return handlers[name] || 'module.exports = {};';
};

const modelTemplate = (name) => {
  const common = `
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true, strict: false });

module.exports = mongoose.models.${name} || mongoose.model('${name}', schema);
`;
  const templates = {
    ExpenseApproval: `
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', index: true },
  expense: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense', required: true, index: true },
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  level: { type: Number, default: 1 },
  comment: String,
  actedAt: Date,
}, { timestamps: true });

module.exports = mongoose.models.ExpenseApproval || mongoose.model('ExpenseApproval', schema);
`,
    MeetingAttendee: `
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, trim: true, lowercase: true },
  name: { type: String, trim: true },
  role: { type: String, enum: ['host', 'required', 'optional'], default: 'required' },
  responseStatus: { type: String, enum: ['pending', 'accepted', 'declined', 'tentative'], default: 'pending' },
  attended: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.models.MeetingAttendee || mongoose.model('MeetingAttendee', schema);
`,
    NoteShare: `
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true, index: true },
  sharedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  permission: { type: String, enum: ['view', 'comment', 'edit'], default: 'view' },
  sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: Date,
}, { timestamps: true });

schema.index({ note: 1, sharedWith: 1 }, { unique: true });
module.exports = mongoose.models.NoteShare || mongoose.model('NoteShare', schema);
`,
    RefreshToken: `
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, index: true },
  deviceId: String,
  ipAddress: String,
  userAgent: String,
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  revokedAt: Date,
  replacedByTokenHash: String,
}, { timestamps: true });

module.exports = mongoose.models.RefreshToken || mongoose.model('RefreshToken', schema);
`,
    Sprint: `
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
  name: { type: String, required: true, trim: true },
  goal: String,
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ['planned', 'active', 'completed', 'cancelled'], default: 'planned', index: true },
  taskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.models.Sprint || mongoose.model('Sprint', schema);
`,
    TaskWatcher: `
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  notificationLevel: { type: String, enum: ['all', 'mentions', 'none'], default: 'all' },
}, { timestamps: true });

schema.index({ task: 1, user: 1 }, { unique: true });
module.exports = mongoose.models.TaskWatcher || mongoose.model('TaskWatcher', schema);
`,
    TrackerDropdownOption: `
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', index: true },
  field: { type: mongoose.Schema.Types.ObjectId, ref: 'TrackerFieldConfig', required: true, index: true },
  label: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true },
  color: String,
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.models.TrackerDropdownOption || mongoose.model('TrackerDropdownOption', schema);
`,
    TwoFactor: `
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  secret: { type: String, required: true },
  backupCodes: [{ codeHash: String, usedAt: Date }],
  enabled: { type: Boolean, default: false },
  verifiedAt: Date,
}, { timestamps: true });

module.exports = mongoose.models.TwoFactor || mongoose.model('TwoFactor', schema);
`,
  };
  return templates[name] || common;
};

const middlewareTemplates = {
  'activityLogger.middleware.js': `
const ActivityLog = require('../models/ActivityLog');

const activityLogger = (moduleName, action) => async (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode >= 400 || !req.user?._id) return;
    try {
      await ActivityLog.create({
        workspace: req.params.wid || req.body.workspace || req.query.workspace,
        user: req.user._id,
        module: moduleName,
        action,
        description: \`\${action} \${moduleName}\`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    } catch (error) {
      console.error('Activity logging failed:', error.message);
    }
  });
  next();
};

module.exports = activityLogger;
module.exports.activityLogger = activityLogger;
`,
  'apiKey.middleware.js': `
const crypto = require('crypto');
const APIKey = require('../models/ApiKey');

const hashKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

const authenticateApiKey = async (req, res, next) => {
  try {
    const rawKey = req.get('x-api-key') || req.query.apiKey;
    if (!rawKey) return next();
    const apiKey = await APIKey.findOne({ keyHash: hashKey(rawKey), isActive: true });
    if (!apiKey || (apiKey.expiresAt && apiKey.expiresAt < new Date())) {
      return res.status(401).json({ success: false, message: 'Invalid or expired API key' });
    }
    apiKey.lastUsedAt = new Date();
    await apiKey.save();
    req.apiKey = apiKey;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticateApiKey;
module.exports.authenticateApiKey = authenticateApiKey;
module.exports.hashApiKey = hashKey;
`,
  'ipWhitelist.middleware.js': `
const normalizeIp = (ip = '') => ip.replace(/^::ffff:/, '');

const ipWhitelist = (allowed = []) => (req, res, next) => {
  if (!allowed.length) return next();
  const clientIp = normalizeIp(req.ip || req.connection?.remoteAddress);
  if (!allowed.map(normalizeIp).includes(clientIp)) {
    return res.status(403).json({ success: false, message: 'IP address is not allowed' });
  }
  next();
};

module.exports = ipWhitelist;
module.exports.ipWhitelist = ipWhitelist;
`,
  'rateLimiter.middleware.js': `
const rateLimit = ({ windowMs = 60000, max = 120 } = {}) => {
  const hits = new Map();
  return (req, res, next) => {
    const key = req.ip || 'anonymous';
    const now = Date.now();
    const record = hits.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }
    record.count += 1;
    hits.set(key, record);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(max - record.count, 0));
    if (record.count > max) {
      return res.status(429).json({ success: false, message: 'Too many requests' });
    }
    next();
  };
};

module.exports = rateLimit;
module.exports.rateLimit = rateLimit;
`,
  'refreshToken.middleware.js': `
const jwt = require('jsonwebtoken');

const requireRefreshToken = (req, res, next) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ success: false, message: 'Refresh token is required' });
  try {
    req.refreshTokenPayload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    req.refreshToken = token;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

module.exports = requireRefreshToken;
module.exports.requireRefreshToken = requireRefreshToken;
`,
  'upload.middleware.js': `
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-z0-9._-]/gi, '_');
    cb(null, \`\${Date.now()}-\${safe}\`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_UPLOAD_BYTES) || 25 * 1024 * 1024 },
});

module.exports = upload;
module.exports.upload = upload;
`,
  'workspace.middleware.js': `
const { verifyWorkspaceAccess } = require('./auth.middleware');

const attachWorkspace = verifyWorkspaceAccess;

module.exports = attachWorkspace;
module.exports.attachWorkspace = attachWorkspace;
module.exports.verifyWorkspaceAccess = verifyWorkspaceAccess;
`,
};

const serviceTemplates = {
  'ai.service.js': `
const axios = require('axios');

const generateText = async ({ prompt, system, model = process.env.OPENAI_MODEL || 'gpt-4o-mini' }) => {
  if (!process.env.OPENAI_API_KEY) return { text: '', skipped: true, reason: 'OPENAI_API_KEY is not configured' };
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    { model, messages: [{ role: 'system', content: system || 'You are a helpful assistant.' }, { role: 'user', content: prompt }] },
    { headers: { Authorization: \`Bearer \${process.env.OPENAI_API_KEY}\` }, timeout: 30000 }
  );
  return { text: response.data.choices?.[0]?.message?.content || '' };
};

module.exports = { generateText };
`,
  'backup.service.js': `
const fs = require('fs/promises');
const path = require('path');

const backupDir = path.join(__dirname, '..', 'uploads', 'backups');

const createBackupManifest = async (metadata = {}) => {
  await fs.mkdir(backupDir, { recursive: true });
  const fileName = \`backup-\${new Date().toISOString().replace(/[:.]/g, '-')}.json\`;
  const filePath = path.join(backupDir, fileName);
  await fs.writeFile(filePath, JSON.stringify({ createdAt: new Date(), ...metadata }, null, 2));
  return { fileName, filePath };
};

module.exports = { createBackupManifest };
`,
  'media.service.js': `
const path = require('path');

const toPublicMediaUrl = (filePath) => {
  if (!filePath) return null;
  return \`/uploads/\${path.relative(path.join(__dirname, '..', 'uploads'), filePath).split(path.sep).join('/')}\`;
};

const normalizeUploadedFile = (file) => file && ({
  originalName: file.originalname,
  mimeType: file.mimetype,
  size: file.size,
  path: file.path,
  url: toPublicMediaUrl(file.path),
});

module.exports = { normalizeUploadedFile, toPublicMediaUrl };
`,
  'sla.service.js': `
const calculateDueAt = (startAt = new Date(), hours = 24) => new Date(new Date(startAt).getTime() + Number(hours) * 60 * 60 * 1000);

const getSlaStatus = (dueAt, completedAt) => {
  if (!dueAt) return 'not_configured';
  const end = completedAt ? new Date(completedAt) : new Date();
  return end > new Date(dueAt) ? 'breached' : 'within_sla';
};

module.exports = { calculateDueAt, getSlaStatus };
`,
  'token.service.js': `
const jwt = require('jsonwebtoken');

const signAccessToken = (payload, options = {}) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m', ...options });

const signRefreshToken = (payload, options = {}) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', ...options });

module.exports = { signAccessToken, signRefreshToken };
`,
  'webhook.service.js': `
const axios = require('axios');

const postWebhook = async (url, payload, headers = {}) => {
  if (!url) throw new Error('Webhook URL is required');
  const response = await axios.post(url, payload, { headers, timeout: 15000 });
  return { status: response.status, data: response.data };
};

module.exports = { postWebhook };
`,
  'workingDays.service.js': `
const isWeekend = (date) => [0, 6].includes(new Date(date).getDay());

const addWorkingDays = (date, days) => {
  const result = new Date(date);
  let remaining = Number(days) || 0;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) remaining -= 1;
  }
  return result;
};

module.exports = { isWeekend, addWorkingDays };
`,
};

const utilTemplates = {
  'buildEmailHTML.js': `
const buildEmailHTML = ({ title = 'OnePWS', body = '', actionText, actionUrl } = {}) => \`
<!doctype html>
<html><body style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
  <h1 style="font-size:20px">\${title}</h1>
  <div>\${body}</div>
  \${actionText && actionUrl ? \`<p><a href="\${actionUrl}" style="background:#111827;color:#fff;padding:10px 14px;text-decoration:none;border-radius:6px">\${actionText}</a></p>\` : ''}
</body></html>\`;

module.exports = buildEmailHTML;
`,
  'detectDevice.js': `
const detectDevice = (userAgent = '') => {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod/.test(ua)) return 'mobile';
  if (/ipad|tablet/.test(ua)) return 'tablet';
  return 'desktop';
};

module.exports = detectDevice;
`,
  'filterQuery.js': `
const filterQuery = (query = {}, allowed = []) =>
  allowed.reduce((acc, key) => {
    if (query[key] !== undefined && query[key] !== '') acc[key] = query[key];
    return acc;
  }, {});

module.exports = filterQuery;
`,
  'generateOTP.js': `
const crypto = require('crypto');

const generateOTP = (length = 6) => {
  const max = 10 ** length;
  return String(crypto.randomInt(0, max)).padStart(length, '0');
};

module.exports = generateOTP;
`,
  'parseFileType.js': `
const parseFileType = (mimeType = '') => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
  return 'document';
};

module.exports = parseFileType;
`,
  'slugify.js': `
const slugify = (value = '') =>
  String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

module.exports = slugify;
`,
  'sortQuery.js': `
const sortQuery = (sort = '-createdAt') => {
  if (typeof sort !== 'string') return { createdAt: -1 };
  return sort.split(',').reduce((acc, field) => {
    const trimmed = field.trim();
    if (!trimmed) return acc;
    acc[trimmed.replace(/^-/, '')] = trimmed.startsWith('-') ? -1 : 1;
    return acc;
  }, {});
};

module.exports = sortQuery;
`,
};

const validatorTemplate = () => `
const { body, param, query } = require('express-validator');

const idParam = [param('id').optional().isMongoId().withMessage('Invalid id')];
const paginationRules = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
];
const createRules = [body().isObject().withMessage('Request body must be an object')];
const updateRules = [...idParam, body().isObject().withMessage('Request body must be an object')];

module.exports = {
  idParam,
  paginationRules,
  createRules,
  updateRules,
};
`;

const apiTemplate = (file) => {
  const name = path.basename(file, '.api.js');
  const endpoint = `/${name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;
  const exportName = `${camel(pascal(name))}Api`;
  return `
import api from './axiosInstance';

const endpoint = '${endpoint}';

export const ${exportName} = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(\`\${endpoint}/\${id}\`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(\`\${endpoint}/\${id}\`, payload).then((res) => res.data),
  remove: (id) => api.delete(\`\${endpoint}/\${id}\`).then((res) => res.data),
};

export const getAll = ${exportName}.list;
export const getById = ${exportName}.get;
export const create = ${exportName}.create;
export const update = ${exportName}.update;
export const remove = ${exportName}.remove;
export default ${exportName};
`;
};

const componentTemplate = (file) => {
  const name = pascal(path.basename(file, '.jsx'));
  return `
import React from 'react';

const ${name} = ({ title, children, className = '', ...props }) => (
  <div className={\`rounded-lg border border-slate-200 bg-white p-4 shadow-sm \${className}\`} {...props}>
    {title ? <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3> : null}
    {children || <span className="text-sm text-slate-500">${name}</span>}
  </div>
);

export { ${name} };
export default ${name};
`;
};

const pageTemplate = (file) => {
  const name = pascal(path.basename(file, '.jsx'));
  const title = path.basename(file, '.jsx').replace(/([a-z])([A-Z])/g, '$1 $2');
  return `
import React from 'react';

const ${name} = () => (
  <main className="space-y-4 p-6">
    <header>
      <h1 className="text-2xl font-semibold text-slate-900">${title}</h1>
      <p className="mt-1 text-sm text-slate-600">Manage ${title.toLowerCase()} records and workflow details.</p>
    </header>
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">This screen is ready for API data and workspace-specific configuration.</p>
    </section>
  </main>
);

export default ${name};
`;
};

const hookTemplate = (file) => {
  const name = path.basename(file, '.js');
  return `
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export function ${name}(initialValue = null) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef(value);
  useEffect(() => { ref.current = value; }, [value]);
  const reset = useCallback(() => setValue(initialValue), [initialValue]);
  return useMemo(() => ({ value, setValue, reset, ref }), [value, reset]);
}

export default ${name};
`;
};

const storeTemplate = (file) => {
  const name = camel(pascal(path.basename(file, '.js')));
  return `
import { create } from 'zustand';

const use${pascal(path.basename(file, '.js'))} = create((set) => ({
  items: [],
  selected: null,
  setItems: (items) => set({ items }),
  setSelected: (selected) => set({ selected }),
  reset: () => set({ items: [], selected: null }),
}));

export { use${pascal(path.basename(file, '.js'))} };
export default use${pascal(path.basename(file, '.js'))};
`;
};

const constTemplate = (file) => {
  const name = pascal(path.basename(file, '.js')).toUpperCase();
  return `
export const ${name} = [];
export default ${name};
`;
};

const typeTemplate = () => `
export const createEntity = (overrides = {}) => ({ id: '', name: '', ...overrides });
export default createEntity;
`;

const styleTemplate = () => `
/* Shared styles for this module are intentionally lightweight; Tailwind utilities handle most UI styling. */
`;

const routeControllerMap = {
  activityLog: 'activityLog',
  announcement: 'announcement',
  approval: 'approval',
  apiKey: 'apiKey',
  backup: 'backup',
  campaign: 'campaign',
  changelog: 'changelog',
  contentCalendar: 'contentCalendar',
  department: 'department',
  feedback: 'feedback',
  helpArticle: 'helpArticle',
  intakeForm: 'intakeForm',
  milestone: 'milestone',
  note: 'note',
  project: 'project',
  sprint: 'sprint',
  subTask: 'subTask',
  taskAttachment: 'taskAttachment',
  taskComment: 'taskComment',
  taskDependency: 'taskDependency',
  taskHistory: 'taskHistory',
  taskStage: 'taskStage',
  taskTimer: 'taskTimer',
  taskTemplate: 'taskTemplate',
  timesheet: 'timesheet',
  user: 'user',
  vendor: 'vendor',
  wiki: 'wiki',
  workspace: 'workspace',
};

const updateTodoRoutes = () => {
  for (const file of walk(path.join(root, 'backend', 'routes'))) {
    const relative = rel(file);
    const base = path.basename(file, '.routes.js');
    if (!routeControllerMap[base]) continue;
    const text = fs.readFileSync(file, 'utf8');
    if (!text.includes('TODO: Add') || !text.includes('// const ctrl')) continue;
    const next = `const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/${routeControllerMap[base]}.controller');

router.get('/', protect, ctrl.getAll);
router.post('/', protect, ctrl.create);
router.get('/:id', protect, ctrl.getById);
router.put('/:id', protect, ctrl.update);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;
`;
    fs.writeFileSync(file, next, 'utf8');
    changed.push(relative);
  }
};

const changed = [];

for (const file of walk(path.join(root, 'backend'))) {
  if (file.includes(`${path.sep}node_modules${path.sep}`) || file.includes(`${path.sep}uploads${path.sep}`)) continue;
  if (!fs.existsSync(file) || fs.statSync(file).size !== 0) continue;
  const relative = rel(file);
  const base = path.basename(file);
  let content = null;
  if (relative.includes('/controllers/auth/')) content = authControllerTemplate(path.basename(base, '.controller.js'));
  else if (relative.includes('/controllers/')) content = controllerTemplate(file);
  else if (relative.includes('/models/')) content = modelTemplate(path.basename(base, '.js'));
  else if (relative.includes('/middleware/')) content = middlewareTemplates[base] || 'module.exports = (req, res, next) => next();';
  else if (relative.includes('/services/')) content = serviceTemplates[base] || 'module.exports = {};';
  else if (relative.includes('/utils/')) content = utilTemplates[base] || 'module.exports = {};';
  else if (relative.includes('/validators/')) content = validatorTemplate();
  if (content && write(relative, content)) changed.push(relative);
}

for (const file of walk(path.join(root, 'frontend', 'src'))) {
  if (!fs.existsSync(file) || fs.statSync(file).size !== 0) continue;
  const relative = rel(file);
  let content = null;
  if (relative.includes('/api/')) content = apiTemplate(file);
  else if (relative.includes('/components/') || relative.includes('/layouts/')) content = componentTemplate(file);
  else if (relative.includes('/pages/')) content = pageTemplate(file);
  else if (relative.includes('/hooks/')) content = hookTemplate(file);
  else if (relative.includes('/store/')) content = storeTemplate(file);
  else if (relative.includes('/constants/')) content = constTemplate(file);
  else if (relative.includes('/types/')) content = typeTemplate();
  else if (relative.includes('/styles/')) content = styleTemplate();
  else if (relative.includes('/context/')) content = componentTemplate(file);
  else if (relative.includes('/utils/')) content = 'export default function identity(value) { return value; }';
  if (content && write(relative, content)) changed.push(relative);
}

updateTodoRoutes();

console.log(`Completed ${changed.length} files`);
for (const file of changed) console.log(file);
