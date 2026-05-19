const dayjs = require('dayjs');
const asyncHandler = require('../utils/asyncHandler');
const TimeLog = require('../models/TimeLog');
const Timesheet = require('../models/Timesheet');
const Task = require('../models/Task');
const timesheetService = require('../services/timesheet.service');
const taskTimerService = require('../services/taskTimer.service');

const getWorkspaceId = (req) => req.params.wid || req.params.workspaceId || req.query.workspace || req.body.workspace || req.workspace?._id;
const getUserId = (req) => req.user?._id || req.body.user || req.query.user;

async function ensureEditablePeriod({ workspace, user, date }) {
  const settings = await timesheetService.getSettings(workspace);
  if (!settings.allowFutureTimeLog && dayjs(date).isAfter(dayjs(), 'day')) {
    const error = new Error('Future time logs are not allowed');
    error.statusCode = 400;
    throw error;
  }
  const period = timesheetService.getPeriodRange({
    date,
    periodType: settings.periodType,
    weekStartDay: settings.weekStartDay,
  });
  const existingTimesheet = await Timesheet.findOne({ workspace, user, periodStart: period.start, periodEnd: period.end });
  if (existingTimesheet && ['submitted', 'approved', 'locked'].includes(existingTimesheet.status)) {
    const error = new Error('Cannot edit time logs in a submitted or approved timesheet');
    error.statusCode = 400;
    throw error;
  }
  return settings;
}

function handleError(error, res) {
  return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Time log operation failed' });
}

const list = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  const query = { isDeleted: { $ne: true } };
  if (workspace) query.workspace = workspace;
  if (req.query.user) query.user = req.query.user;
  if (req.query.task || req.params.taskId || req.params.task) query.task = req.query.task || req.params.taskId || req.params.task;
  if (req.query.project || req.params.projectId || req.params.project) query.project = req.query.project || req.params.projectId || req.params.project;
  if (req.query.status) query.approvalStatus = req.query.status;
  if (req.query.from || req.query.to) {
    query.logDate = {};
    if (req.query.from) query.logDate.$gte = dayjs(req.query.from).startOf('day').toDate();
    if (req.query.to) query.logDate.$lte = dayjs(req.query.to).endOf('day').toDate();
  }

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const [items, total] = await Promise.all([
    TimeLog.find(query)
      .populate('user', 'name firstName lastName email')
      .populate('task', 'taskNumber title')
      .populate('project', 'projectNumber title')
      .sort({ logDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    TimeLog.countDocuments(query),
  ]);

  res.json({ success: true, data: items, timeLogs: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

const myLogs = asyncHandler(async (req, res) => {
  req.query.user = getUserId(req);
  return list(req, res);
});

const create = asyncHandler(async (req, res) => {
  try {
    const workspace = getWorkspaceId(req);
    const user = getUserId(req);
    const { logDate, project, durationMinutes, workType, description, billable, startTime, endTime } = req.body;
    const task = req.params.taskId || req.body.task;
    const settings = await ensureEditablePeriod({ workspace, user, date: logDate });

    if (settings.requireDescription && !description?.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }
    if (settings.requireTaskForTimeLog && !task) {
      return res.status(400).json({ success: false, message: 'Task is required for time log' });
    }
    if (!durationMinutes || Number(durationMinutes) <= 0 || Number(durationMinutes) > 1440) {
      return res.status(400).json({ success: false, message: 'Duration must be between 1 minute and 24 hours' });
    }

    let linkedTask = null;
    if (task) {
      linkedTask = await Task.findOne({ _id: task, workspace, isDeleted: { $ne: true } });
      if (!linkedTask) return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const timeLog = await TimeLog.create({
      workspace,
      user,
      department: req.workspaceDepartment || req.body.department || linkedTask?.department,
      task,
      project: project || linkedTask?.project,
      logDate,
      startTime,
      endTime,
      durationMinutes,
      workType,
      description,
      billable: Boolean(billable),
      source: 'manual',
      approvalStatus: 'draft',
      createdBy: user,
    });

    await timesheetService.syncTimesheetForDate({
      workspace,
      user,
      department: timeLog.department,
      date: timeLog.logDate,
    });
    if (task) await taskTimerService.recalculateTaskActualHours(task);
    if (timeLog.project) await taskTimerService.recalculateProjectActualHours(timeLog.project);

    res.status(201).json({ success: true, message: 'Time log created successfully', data: timeLog, timeLog });
  } catch (error) {
    return handleError(error, res);
  }
});

const getById = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  const item = await TimeLog.findOne({ _id: req.params.timeLogId || req.params.id, workspace, isDeleted: { $ne: true } });
  if (!item) return res.status(404).json({ success: false, message: 'Time log not found' });
  res.json({ success: true, data: item, timeLog: item });
});

const update = asyncHandler(async (req, res) => {
  try {
    const workspace = getWorkspaceId(req);
    const item = await TimeLog.findOne({ _id: req.params.timeLogId || req.params.id, workspace, isDeleted: { $ne: true } });
    if (!item) return res.status(404).json({ success: false, message: 'Time log not found' });
    if (item.isLocked || ['submitted', 'approved'].includes(item.approvalStatus)) {
      return res.status(400).json({ success: false, message: 'Submitted or approved time logs cannot be edited' });
    }
    await ensureEditablePeriod({ workspace, user: item.user, date: req.body.logDate || item.logDate });

    Object.assign(item, req.body, { updatedBy: req.user?._id });
    await item.save();
    await timesheetService.syncTimesheetForDate({ workspace, user: item.user, department: item.department, date: item.logDate });
    if (item.task) await taskTimerService.recalculateTaskActualHours(item.task);
    if (item.project) await taskTimerService.recalculateProjectActualHours(item.project);
    res.json({ success: true, message: 'Time log updated successfully', data: item, timeLog: item });
  } catch (error) {
    return handleError(error, res);
  }
});

const remove = asyncHandler(async (req, res) => {
  try {
    const workspace = getWorkspaceId(req);
    const item = await TimeLog.findOne({ _id: req.params.timeLogId || req.params.id, workspace, isDeleted: { $ne: true } });
    if (!item) return res.status(404).json({ success: false, message: 'Time log not found' });
    if (item.isLocked || ['submitted', 'approved'].includes(item.approvalStatus)) {
      return res.status(400).json({ success: false, message: 'Submitted or approved time logs cannot be deleted' });
    }
    await ensureEditablePeriod({ workspace, user: item.user, date: item.logDate });

    item.isDeleted = true;
    item.deletedAt = new Date();
    item.deletedBy = req.user?._id;
    await item.save();
    await timesheetService.syncTimesheetForDate({ workspace, user: item.user, department: item.department, date: item.logDate });
    if (item.task) await taskTimerService.recalculateTaskActualHours(item.task);
    if (item.project) await taskTimerService.recalculateProjectActualHours(item.project);
    res.json({ success: true, message: 'Time log deleted' });
  } catch (error) {
    return handleError(error, res);
  }
});

module.exports = {
  list,
  getAll: list,
  myLogs,
  create,
  getById,
  update,
  remove,
  delete: remove,
};
