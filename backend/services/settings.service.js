const WorkspaceSettings = require('../models/WorkspaceSettings');
const EmailSettings = require('../models/EmailSettings');
const NotificationSettings = require('../models/NotificationSettings');
const IntegrationSettings = require('../models/IntegrationSettings');
const SecuritySettings = require('../models/SecuritySettings');
const AutomationSettings = require('../models/AutomationSettings');
const TimesheetSettings = require('../models/TimesheetSettings');
const { encrypt } = require('./settingsEncryption.service');

const cache = new Map();

const CATEGORY_MAP = {
  general: { model: WorkspaceSettings, path: 'general' },
  branding: { model: WorkspaceSettings, path: 'branding' },
  modules: { model: WorkspaceSettings, path: 'modules' },
  tasks: { model: WorkspaceSettings, path: 'tasks' },
  tracker: { model: WorkspaceSettings, path: 'tracker' },
  calendar: { model: WorkspaceSettings, path: 'calendar' },
  reports: { model: WorkspaceSettings, path: 'reports' },
  media: { model: WorkspaceSettings, path: 'media' },
  meetings: { model: WorkspaceSettings, path: 'meetings' },
  mom: { model: WorkspaceSettings, path: 'mom' },
  sla: { model: WorkspaceSettings, path: 'sla' },
  'budget-expenses': { model: WorkspaceSettings, path: 'budgetExpenses' },
  notes: { model: WorkspaceSettings, path: 'notes' },
  backup: { model: WorkspaceSettings, path: 'backup' },
  notifications: { model: NotificationSettings },
  email: { model: EmailSettings },
  integrations: { model: IntegrationSettings },
  security: { model: SecuritySettings },
  automation: { model: AutomationSettings },
  timesheets: { model: TimesheetSettings },
};

function getCategoryConfig(category) {
  return CATEGORY_MAP[category];
}

function encryptSecrets(category, data) {
  const payload = { ...data };
  if (category === 'email') {
    if (payload.smtp?.password) {
      payload.smtp = { ...payload.smtp, passwordEncrypted: encrypt(payload.smtp.password) };
      delete payload.smtp.password;
    }
    if (payload.brevo?.apiKey) {
      payload.brevo = { ...payload.brevo, apiKeyEncrypted: encrypt(payload.brevo.apiKey) };
      delete payload.brevo.apiKey;
    }
    if (payload.sendgrid?.apiKey) {
      payload.sendgrid = { ...payload.sendgrid, apiKeyEncrypted: encrypt(payload.sendgrid.apiKey) };
      delete payload.sendgrid.apiKey;
    }
  }
  ['slack', 'telegram', 'google', 'zoom', 'openai'].forEach((key) => {
    if (payload[key]) {
      ['webhookUrl', 'botToken', 'clientSecret', 'apiKey', 'serviceAccountJson', 'accountId'].forEach((secretKey) => {
        if (payload[key][secretKey]) {
          payload[key][`${secretKey}Encrypted`] = encrypt(payload[key][secretKey]);
          delete payload[key][secretKey];
        }
      });
    }
  });
  return payload;
}

async function getCategorySettings(workspace, category) {
  const config = getCategoryConfig(category);
  if (!config) return null;
  const doc = await config.model.findOneAndUpdate({ workspace }, { $setOnInsert: { workspace } }, { new: true, upsert: true, setDefaultsOnInsert: true });
  return config.path ? doc[config.path] || {} : doc;
}

async function updateCategorySettings({ workspace, category, data, updatedBy }) {
  const config = getCategoryConfig(category);
  if (!config) throw new Error('Invalid settings category');
  const payload = encryptSecrets(category, data);
  const update = config.path
    ? { $set: { [config.path]: payload, updatedBy }, $setOnInsert: { workspace } }
    : { $set: { ...payload, updatedBy }, $setOnInsert: { workspace } };
  const doc = await config.model.findOneAndUpdate({ workspace }, update, { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true });
  clearWorkspaceSettingsCache(workspace);
  return config.path ? doc[config.path] : doc;
}

async function getWorkspaceSettings(workspace) {
  const key = `settings:${workspace}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  const settings = await WorkspaceSettings.findOneAndUpdate({ workspace }, { $setOnInsert: { workspace } }, { new: true, upsert: true, setDefaultsOnInsert: true });
  cache.set(key, { data: settings, expiresAt: Date.now() + 5 * 60 * 1000 });
  return settings;
}

function clearWorkspaceSettingsCache(workspace) {
  cache.delete(`settings:${workspace}`);
}

function moduleWarnings(modules = {}) {
  const warnings = [];
  if (modules.tasks === false) warnings.push('SLA, Intake, Timesheets and Approvals may stop working because they depend on Tasks.');
  if (modules.calendar === false) warnings.push('Meetings, SLA events and task due reminders will not appear in calendar.');
  if (modules.notifications === false) warnings.push('Users will not receive in-app alerts.');
  if (modules.budget === false && modules.expenses) warnings.push('Expenses module depends on Budget module.');
  if (modules.settings === false) warnings.push('Settings module cannot be disabled for admins.');
  return warnings;
}

module.exports = {
  CATEGORY_MAP,
  getCategoryConfig,
  getCategorySettings,
  updateCategorySettings,
  getWorkspaceSettings,
  clearWorkspaceSettingsCache,
  moduleWarnings,
};
