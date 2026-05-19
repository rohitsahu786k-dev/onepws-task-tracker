const Task = require('../models/Task');
const taskActivityService = require('./taskActivity.service');

async function attachToTask({ workspace, taskId, attachment, user }) {
  const task = await Task.findOne({ _id: taskId, workspace, isDeleted: { $ne: true } });
  if (!task) return null;
  task.attachments.push({ ...attachment, uploadedBy: user?._id || user, uploadedAt: new Date() });
  await task.save();
  await taskActivityService.log({
    workspace,
    task: task._id,
    action: 'attachment_added',
    newValue: attachment,
    performedBy: user?._id || user,
  });
  return task.attachments[task.attachments.length - 1];
}

module.exports = { attachToTask };
