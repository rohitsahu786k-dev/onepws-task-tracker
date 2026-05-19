const TaskActivity = require('../models/TaskActivity');

async function log(payload) {
  if (!payload?.workspace || !payload?.task || !payload?.action) return null;
  return TaskActivity.create(payload);
}

async function listForTask(workspace, task) {
  return TaskActivity.find({ workspace, task })
    .populate('performedBy', 'name firstName lastName email avatar')
    .sort({ createdAt: -1 });
}

module.exports = { log, listForTask };
