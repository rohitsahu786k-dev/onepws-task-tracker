const dayjs = require('dayjs');
const EmployeeProfile = require('../models/EmployeeProfile');
const Task = require('../models/Task');
const Project = require('../models/Project');
const TimeLog = require('../models/TimeLog');

async function recalculateEmployeeWorkload(employeeId) {
  const employee = await EmployeeProfile.findById(employeeId);
  if (!employee) return null;

  const weekStart = dayjs().startOf('week').add(1, 'day').startOf('day').toDate();
  const weekEnd = dayjs(weekStart).add(6, 'day').endOf('day').toDate();
  const [openTasks, overdueTasks, activeProjects, timeLogs] = await Promise.all([
    Task.countDocuments({ workspace: employee.workspace, assignedTo: employee.user, status: { $nin: ['closed', 'completed', 'cancelled'] }, isDeleted: { $ne: true } }),
    Task.countDocuments({ workspace: employee.workspace, assignedTo: employee.user, dueDate: { $lt: new Date() }, status: { $nin: ['closed', 'completed', 'cancelled'] }, isDeleted: { $ne: true } }),
    Project.countDocuments({ workspace: employee.workspace, 'members.user': employee.user, status: { $in: ['planning', 'active', 'on_hold'] }, isDeleted: { $ne: true } }),
    TimeLog.find({ workspace: employee.workspace, user: employee.user, logDate: { $gte: weekStart, $lte: weekEnd }, isDeleted: { $ne: true } }).select('durationMinutes'),
  ]);

  const loggedHoursThisWeek = Number((timeLogs.reduce((sum, log) => sum + Number(log.durationMinutes || 0), 0) / 60).toFixed(2));
  const capacity = employee.workloadSummary?.capacityHoursPerWeek || 40;
  employee.workloadSummary = {
    openTasks,
    overdueTasks,
    activeProjects,
    loggedHoursThisWeek,
    capacityHoursPerWeek: capacity,
    workloadPercent: capacity ? Math.round((loggedHoursThisWeek / capacity) * 100) : 0,
  };
  await employee.save();
  return employee.workloadSummary;
}

module.exports = { recalculateEmployeeWorkload };
