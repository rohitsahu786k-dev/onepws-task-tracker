const notificationService = require('./notification.service');

async function notifyTaskAssigned({ workspace, sender, task }) {
  return notificationService.notify({
    workspace,
    sender,
    recipients: task.assignedTo || [],
    type: 'task_assigned',
    title: `Task Assigned: ${task.taskNumber}`,
    message: `${task.title} has been assigned to you.`,
    refModel: 'Task',
    refId: task._id,
    actionUrl: `/tasks/${task._id}`,
    priority: task.priority,
    channels: { inApp: true, email: true },
    metadata: { taskNumber: task.taskNumber, taskTitle: task.title, dueDate: task.dueDate },
  });
}

module.exports = {
  notify: notificationService.notify,
  notifyTaskAssigned,
};
