const TaskComment = require('../models/TaskComment');
const taskActivityService = require('./taskActivity.service');
const notificationService = require('./notification.service');

async function addComment({ workspace, task, user, message, mentions = [], attachments = [], isInternal = false, commentType = 'comment' }) {
  const comment = await TaskComment.create({
    workspace,
    task: task._id || task,
    message,
    mentions,
    attachments,
    isInternal,
    commentType,
    createdBy: user?._id || user,
  });

  await taskActivityService.log({
    workspace,
    task: task._id || task,
    action: 'comment_added',
    message: 'Comment added',
    performedBy: user?._id || user,
  });

  if (mentions.length) {
    await notificationService.notify({
      workspace,
      sender: user?._id || user,
      recipients: mentions,
      type: 'mention',
      title: 'You were mentioned in a task',
      message: message.slice(0, 160),
      refModel: 'Task',
      refId: task._id || task,
      channels: { inApp: true, email: true },
    });
  }

  return comment;
}

module.exports = { addComment };
