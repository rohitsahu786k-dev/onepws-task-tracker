const ActivityLog = require('../models/ActivityLog');

async function log(payload = {}) {
  try {
    return await ActivityLog.create({
      workspace: payload.workspace,
      user: payload.user,
      module: payload.module || 'system',
      action: payload.action || 'updated',
      refModel: payload.refModel,
      refId: payload.refId,
      description: payload.description,
      oldValue: payload.oldValue,
      newValue: payload.newValue,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent
    });
  } catch (error) {
    console.warn('[activityLog] failed:', error.message);
    return null;
  }
}

module.exports = { log };
