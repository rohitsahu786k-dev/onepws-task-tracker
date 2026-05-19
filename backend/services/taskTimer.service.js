const TaskTimer = require('../models/TaskTimer');
const TimeLog = require('../models/TimeLog');
const Task = require('../models/Task');
const Project = require('../models/Project');

async function getRunningTimer(workspace, task, user) {
  return TaskTimer.findOne({ workspace, task, user, status: 'running' }).sort({ startedAt: -1 });
}

async function recalculateTaskActualHours(taskId) {
  if (!taskId) return null;
  const logs = await TimeLog.find({
    task: taskId,
    isDeleted: { $ne: true },
    approvalStatus: { $in: ['draft', 'submitted', 'approved'] },
  }).select('durationMinutes');

  const totalMinutes = logs.reduce((sum, log) => sum + Number(log.durationMinutes || 0), 0);
  return Task.findByIdAndUpdate(
    taskId,
    { actualHours: Number((totalMinutes / 60).toFixed(2)), loggedHours: Number((totalMinutes / 60).toFixed(2)) },
    { new: true }
  );
}

async function recalculateProjectActualHours(projectId) {
  if (!projectId) return null;
  const logs = await TimeLog.find({
    project: projectId,
    isDeleted: { $ne: true },
    approvalStatus: { $in: ['draft', 'submitted', 'approved'] },
  }).select('durationMinutes');

  const totalMinutes = logs.reduce((sum, log) => sum + Number(log.durationMinutes || 0), 0);
  return Project.findByIdAndUpdate(projectId, { actualHours: Number((totalMinutes / 60).toFixed(2)) }, { new: true });
}

module.exports = { getRunningTimer, recalculateTaskActualHours, recalculateProjectActualHours };
