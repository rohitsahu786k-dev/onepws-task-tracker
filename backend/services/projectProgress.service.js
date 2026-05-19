const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
let Task;
try {
  Task = require('../models/Task');
} catch {
  Task = null;
}

function calculateProjectProgress({ totalTasks, completedTasks, totalMilestones = 0, completedMilestones = 0 }) {
  if (!totalTasks && !totalMilestones) return 0;
  const taskProgress = totalTasks ? (completedTasks / totalTasks) * 100 : 0;
  const milestoneProgress = totalMilestones ? (completedMilestones / totalMilestones) * 100 : 0;
  if (totalTasks && totalMilestones) return Math.round(taskProgress * 0.7 + milestoneProgress * 0.3);
  return Math.round(totalTasks ? taskProgress : milestoneProgress);
}

async function recalculateProjectProgress(projectId) {
  const query = { project: projectId, isDeleted: { $ne: true } };
  const tasks = Task ? await Task.find(query).select('status isOverdue dueDate') : [];
  const milestones = await Milestone.find({ project: projectId, isDeleted: { $ne: true } }).select('status dueDate');

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => ['closed', 'completed', 'done'].includes(task.status)).length;
  const pendingTasks = tasks.filter((task) => !['closed', 'completed', 'done', 'cancelled'].includes(task.status)).length;
  const delayedTasks = tasks.filter((task) => task.isOverdue || (task.dueDate && task.dueDate < new Date() && !['closed', 'completed', 'done', 'cancelled'].includes(task.status))).length;
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((item) => item.status === 'completed').length;
  const delayedMilestones = milestones.filter((item) => item.status === 'delayed' || (item.dueDate && item.dueDate < new Date() && item.status !== 'completed')).length;

  const progressPercent = calculateProjectProgress({ totalTasks, completedTasks, totalMilestones, completedMilestones });

  await Project.findByIdAndUpdate(projectId, {
    progressPercent,
    taskSummary: { totalTasks, completedTasks, pendingTasks, delayedTasks },
    milestoneSummary: { totalMilestones, completedMilestones, delayedMilestones }
  });

  return { progressPercent, taskSummary: { totalTasks, completedTasks, pendingTasks, delayedTasks }, milestoneSummary: { totalMilestones, completedMilestones, delayedMilestones } };
}

module.exports = { calculateProjectProgress, recalculateProjectProgress };
