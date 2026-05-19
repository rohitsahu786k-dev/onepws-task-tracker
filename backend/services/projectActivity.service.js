const ProjectActivity = require('../models/ProjectActivity');

async function log(payload = {}) {
  try {
    return ProjectActivity.create({
      workspace: payload.workspace,
      project: payload.project,
      action: payload.action,
      message: payload.message,
      oldValue: payload.oldValue,
      newValue: payload.newValue,
      performedBy: payload.performedBy
    });
  } catch (error) {
    console.warn('[projectActivity] failed:', error.message);
    return null;
  }
}

module.exports = { log };
