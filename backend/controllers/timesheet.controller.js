const dayjs = require('dayjs');
const asyncHandler = require('../utils/asyncHandler');
const Timesheet = require('../models/Timesheet');
const TimeLog = require('../models/TimeLog');
const TimesheetSettings = require('../models/TimesheetSettings');
const ActiveTimer = require('../models/ActiveTimer');
const Task = require('../models/Task');
const User = require('../models/User');
const timesheetService = require('../services/timesheet.service');
const taskTimerService = require('../services/taskTimer.service');
const notificationService = require('../services/notification.service');
const taskActivityService = require('../services/taskActivity.service');

const getWorkspaceId = (req) => req.params.wid || req.params.workspaceId || req.query.workspace || req.body.workspace || req.workspace?._id;
const getUserId = (req) => req.user?._id || req.body.user || req.query.user;
const getTimesheetId = (req) => req.params.timesheetId || req.params.id;

const list = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  const query = {};
  if (workspace) query.workspace = workspace;
  if (req.query.user) query.user = req.query.user;
  if (req.query.department) query.department = req.query.department;
  if (req.query.status) query.status = req.query.status;
  if (req.query.from || req.query.to) {
    query.periodStart = {};
    if (req.query.from) query.periodStart.$gte = dayjs(req.query.from).startOf('day').toDate();
    if (req.query.to) query.periodStart.$lte = dayjs(req.query.to).endOf('day').toDate();
  }

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const [items, total] = await Promise.all([
    Timesheet.find(query)
      .populate('user', 'name firstName lastName email')
      .populate('approval.approver', 'name firstName lastName email')
      .sort({ periodStart: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Timesheet.countDocuments(query),
  ]);

  res.json({ success: true, data: items, timesheets: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

const myTimesheets = asyncHandler(async (req, res) => {
  req.query.user = getUserId(req);
  return list(req, res);
});

const current = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  const user = getUserId(req);
  const settings = await timesheetService.getSettings(workspace);
  const period = timesheetService.getPeriodRange({
    date: req.query.date || new Date(),
    periodType: req.query.periodType || settings.periodType,
    weekStartDay: settings.weekStartDay,
  });
  const timesheet = await timesheetService.syncTimesheetForDate({
    workspace,
    user,
    department: req.workspaceDepartment,
    date: period.start,
  });
  const logs = await TimeLog.find({ workspace, user, logDate: { $gte: timesheet.periodStart, $lte: timesheet.periodEnd }, isDeleted: { $ne: true } })
    .populate('task', 'taskNumber title')
    .populate('project', 'projectNumber title')
    .sort({ logDate: 1, createdAt: 1 });
  res.json({ success: true, data: { timesheet, logs }, timesheet, logs });
});

const getById = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  const item = await Timesheet.findOne({ _id: getTimesheetId(req), workspace })
    .populate('user', 'name firstName lastName email')
    .populate('approval.approver', 'name firstName lastName email')
    .populate('projectSummary.project', 'projectNumber title')
    .populate('taskSummary.task', 'taskNumber title');
  if (!item) return res.status(404).json({ success: false, message: 'Timesheet not found' });
  const logs = await TimeLog.find({ workspace, timesheet: item._id, isDeleted: { $ne: true } })
    .populate('task', 'taskNumber title')
    .populate('project', 'projectNumber title')
    .sort({ logDate: 1, createdAt: 1 });
  res.json({ success: true, data: { timesheet: item, logs }, timesheet: item, logs });
});

const create = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  const user = req.body.user || getUserId(req);
  const date = req.body.date || req.body.periodStart || new Date();
  const item = await timesheetService.syncTimesheetForDate({ workspace, user, department: req.body.department || req.workspaceDepartment, date });
  res.status(201).json({ success: true, data: item, timesheet: item });
});

const update = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  const item = await Timesheet.findOne({ _id: getTimesheetId(req), workspace });
  if (!item) return res.status(404).json({ success: false, message: 'Timesheet not found' });
  if (item.isLocked || ['submitted', 'approved', 'locked'].includes(item.status)) {
    return res.status(400).json({ success: false, message: 'Submitted or approved timesheets cannot be updated' });
  }
  Object.assign(item, { notes: req.body.notes ?? item.notes });
  await item.save();
  res.json({ success: true, data: item, timesheet: item });
});

const submit = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  const timesheet = await Timesheet.findOne({ _id: getTimesheetId(req), workspace, user: getUserId(req) });
  if (!timesheet) return res.status(404).json({ success: false, message: 'Timesheet not found' });
  if (!['draft', 'reopened', 'rejected'].includes(timesheet.status)) {
    return res.status(400).json({ success: false, message: 'Only draft, rejected or reopened timesheets can be submitted' });
  }

  const userDoc = await User.findById(timesheet.user);
  const approver = req.body.approver || (await timesheetService.resolveApprover({ userDoc, workspaceRole: req.workspaceRole })) || req.user?._id;
  timesheet.status = 'submitted';
  timesheet.submittedAt = new Date();
  timesheet.submittedBy = req.user?._id;
  timesheet.approval = { approver, status: 'pending' };
  await timesheet.save();

  await TimeLog.updateMany({ timesheet: timesheet._id, isDeleted: { $ne: true } }, { $set: { approvalStatus: 'submitted' } });
  if (approver) {
    await notificationService.notify({
      workspace,
      sender: req.user?._id,
      recipients: [approver],
      type: 'timesheet_submitted',
      title: 'Timesheet Approval Required',
      message: `${req.user?.name || 'A user'} submitted a timesheet for approval.`,
      refModel: 'Timesheet',
      refId: timesheet._id,
      actionUrl: `/timesheets/approvals/${timesheet._id}`,
      channels: { inApp: true, email: true },
    });
  }

  res.json({ success: true, message: 'Timesheet submitted successfully', data: timesheet, timesheet });
});

const approve = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  const timesheet = await Timesheet.findOne({ _id: getTimesheetId(req), workspace });
  if (!timesheet) return res.status(404).json({ success: false, message: 'Timesheet not found' });
  const isApprover = timesheet.approval?.approver?.toString() === req.user?._id?.toString();
  if (!isApprover && !['super_admin', 'owner', 'admin'].includes(req.workspaceRole)) {
    return res.status(403).json({ success: false, message: 'You are not the approver for this timesheet' });
  }

  timesheet.status = 'approved';
  timesheet.approval.status = 'approved';
  timesheet.approval.comment = req.body.comment;
  timesheet.approval.approvedAt = new Date();
  timesheet.isLocked = true;
  timesheet.lockedAt = new Date();
  timesheet.lockedBy = req.user?._id;
  await timesheet.save();

  await TimeLog.updateMany(
    { timesheet: timesheet._id, isDeleted: { $ne: true } },
    { $set: { approved: true, approvalStatus: 'approved', approvedBy: req.user?._id, approvedAt: new Date(), isLocked: true } }
  );

  await notificationService.notify({
    workspace,
    sender: req.user?._id,
    recipients: [timesheet.user],
    type: 'timesheet_approved',
    title: 'Timesheet Approved',
    message: 'Your timesheet has been approved.',
    refModel: 'Timesheet',
    refId: timesheet._id,
    actionUrl: `/timesheets/${timesheet._id}`,
    channels: { inApp: true, email: true },
  });

  res.json({ success: true, message: 'Timesheet approved successfully', data: timesheet, timesheet });
});

const reject = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  const reason = req.body.reason || req.body.rejectionReason;
  if (!reason) return res.status(400).json({ success: false, message: 'Rejection reason is required' });
  const timesheet = await Timesheet.findOne({ _id: getTimesheetId(req), workspace });
  if (!timesheet) return res.status(404).json({ success: false, message: 'Timesheet not found' });

  timesheet.status = 'rejected';
  timesheet.approval.status = 'rejected';
  timesheet.approval.rejectionReason = reason;
  timesheet.approval.rejectedAt = new Date();
  await timesheet.save();

  await TimeLog.updateMany(
    { timesheet: timesheet._id, isDeleted: { $ne: true } },
    { $set: { approvalStatus: 'rejected', rejectionReason: reason, rejectedBy: req.user?._id, rejectedAt: new Date(), isLocked: false } }
  );

  await notificationService.notify({
    workspace,
    sender: req.user?._id,
    recipients: [timesheet.user],
    type: 'timesheet_rejected',
    title: 'Timesheet Rejected',
    message: reason,
    refModel: 'Timesheet',
    refId: timesheet._id,
    actionUrl: `/timesheets/${timesheet._id}`,
    priority: 'high',
    channels: { inApp: true, email: true },
  });

  res.json({ success: true, message: 'Timesheet rejected', data: timesheet, timesheet });
});

const reopen = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  if (!req.body.reason) return res.status(400).json({ success: false, message: 'Reopen reason is required' });
  const timesheet = await Timesheet.findOne({ _id: getTimesheetId(req), workspace });
  if (!timesheet) return res.status(404).json({ success: false, message: 'Timesheet not found' });
  timesheet.status = 'reopened';
  timesheet.isLocked = false;
  timesheet.approval.status = 'pending';
  timesheet.approval.rejectionReason = req.body.reason;
  await timesheet.save();
  await TimeLog.updateMany({ timesheet: timesheet._id, isDeleted: { $ne: true } }, { $set: { approvalStatus: 'draft', isLocked: false, approved: false } });
  res.json({ success: true, message: 'Timesheet reopened', data: timesheet, timesheet });
});

const lock = asyncHandler(async (req, res) => {
  const timesheet = await Timesheet.findOneAndUpdate(
    { _id: getTimesheetId(req), workspace: getWorkspaceId(req) },
    { $set: { status: 'locked', isLocked: true, lockedAt: new Date(), lockedBy: req.user?._id } },
    { new: true }
  );
  if (!timesheet) return res.status(404).json({ success: false, message: 'Timesheet not found' });
  await TimeLog.updateMany({ timesheet: timesheet._id, isDeleted: { $ne: true } }, { $set: { isLocked: true } });
  res.json({ success: true, message: 'Timesheet locked', data: timesheet, timesheet });
});

const unlock = asyncHandler(async (req, res) => {
  if (!req.body.reason) return res.status(400).json({ success: false, message: 'Unlock reason is required' });
  const timesheet = await Timesheet.findOneAndUpdate(
    { _id: getTimesheetId(req), workspace: getWorkspaceId(req) },
    { $set: { status: 'reopened', isLocked: false }, $unset: { lockedAt: '', lockedBy: '' } },
    { new: true }
  );
  if (!timesheet) return res.status(404).json({ success: false, message: 'Timesheet not found' });
  await TimeLog.updateMany({ timesheet: timesheet._id, isDeleted: { $ne: true } }, { $set: { isLocked: false } });
  res.json({ success: true, message: 'Timesheet unlocked', data: timesheet, timesheet });
});

const pendingApprovals = asyncHandler(async (req, res) => {
  const query = { workspace: getWorkspaceId(req), status: 'submitted' };
  if (!['super_admin', 'owner', 'admin'].includes(req.workspaceRole)) query['approval.approver'] = req.user?._id;
  const items = await Timesheet.find(query).populate('user', 'name firstName lastName email').sort({ submittedAt: 1 });
  res.json({ success: true, data: items, timesheets: items });
});

const missing = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  const settings = await timesheetService.getSettings(workspace);
  const period = timesheetService.getPeriodRange({ date: req.query.date || new Date(), periodType: settings.periodType, weekStartDay: settings.weekStartDay });
  const submitted = await Timesheet.find({ workspace, periodStart: period.start, periodEnd: period.end, status: { $in: ['submitted', 'approved', 'locked'] } }).select('user');
  const submittedIds = submitted.map((item) => item.user.toString());
  const users = await User.find({ 'workspaces.workspace': workspace, isActive: { $ne: false }, _id: { $nin: submittedIds } }).select('name firstName lastName email');
  res.json({ success: true, data: users, users, period });
});

const dashboard = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  const user = req.query.user || getUserId(req);
  const settings = await timesheetService.getSettings(workspace);
  const period = timesheetService.getPeriodRange({ date: req.query.date || new Date(), periodType: settings.periodType, weekStartDay: settings.weekStartDay });
  const [currentSheet, pendingCount, approvedMonth] = await Promise.all([
    timesheetService.syncTimesheetForDate({ workspace, user, department: req.workspaceDepartment, date: period.start }),
    Timesheet.countDocuments({ workspace, status: 'submitted', 'approval.approver': req.user?._id }),
    Timesheet.countDocuments({ workspace, status: 'approved', periodStart: { $gte: dayjs().startOf('month').toDate(), $lte: dayjs().endOf('month').toDate() } }),
  ]);
  res.json({
    success: true,
    data: {
      current: currentSheet,
      cards: {
        loggedHours: currentSheet.totalHours,
        expectedHours: Number((currentSheet.expectedMinutes / 60).toFixed(2)),
        missingHours: Number((currentSheet.missingMinutes / 60).toFixed(2)),
        overtimeHours: Number((currentSheet.overtimeMinutes / 60).toFixed(2)),
        pendingApproval: pendingCount,
        approvedThisMonth: approvedMonth,
      },
    },
  });
});

const workload = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  const settings = await timesheetService.getSettings(workspace);
  const period = timesheetService.getPeriodRange({ date: req.query.date || new Date(), periodType: 'weekly', weekStartDay: settings.weekStartDay });
  const timesheets = await Timesheet.find({ workspace, periodStart: period.start, periodEnd: period.end }).populate('user', 'name firstName lastName email');
  const data = timesheets.map((sheet) => {
    const expectedHours = Number((sheet.expectedMinutes / 60).toFixed(2));
    const workloadPercent = expectedHours ? Math.round((sheet.totalHours / expectedHours) * 100) : 0;
    return {
      user: sheet.user,
      expectedHours,
      loggedHours: sheet.totalHours,
      workloadPercent,
      status: workloadPercent <= 60 ? 'underloaded' : workloadPercent <= 90 ? 'balanced' : workloadPercent <= 110 ? 'full' : 'overloaded',
    };
  });
  res.json({ success: true, data, workload: data });
});

const getSettings = asyncHandler(async (req, res) => {
  const settings = await timesheetService.getSettings(getWorkspaceId(req));
  res.json({ success: true, data: settings, settings });
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await TimesheetSettings.findOneAndUpdate(
    { workspace: getWorkspaceId(req) },
    { $set: { ...req.body, updatedBy: req.user?._id }, $setOnInsert: { workspace: getWorkspaceId(req), createdBy: req.user?._id } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
  res.json({ success: true, message: 'Timesheet settings updated', data: settings, settings });
});

const activeTimer = asyncHandler(async (req, res) => {
  const timer = await ActiveTimer.findOne({ workspace: getWorkspaceId(req), user: getUserId(req), status: { $in: ['running', 'paused'] } })
    .populate('task', 'taskNumber title')
    .populate('project', 'projectNumber title')
    .sort({ startedAt: -1 });
  res.json({ success: true, data: timer, timer });
});

const startTimer = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  const settings = await timesheetService.getSettings(workspace);
  if (!settings.allowTimer) return res.status(400).json({ success: false, message: 'Task timer is disabled for this workspace' });
  const active = await ActiveTimer.findOne({ workspace, user: getUserId(req), status: { $in: ['running', 'paused'] } });
  if (active) return res.status(409).json({ success: false, message: 'You already have a running timer' });

  const task = await Task.findOne({ _id: req.params.taskId, workspace, isDeleted: { $ne: true } });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  const timer = await ActiveTimer.create({ workspace, user: getUserId(req), task: task._id, project: task.project, startedAt: new Date(), status: 'running' });
  await taskActivityService.log({ workspace, task: task._id, action: 'timer_started', message: 'Timer started', performedBy: req.user?._id });
  res.json({ success: true, message: 'Timer started successfully', data: timer, timer });
});

const pauseTimer = asyncHandler(async (req, res) => {
  const timer = await ActiveTimer.findOne({ workspace: getWorkspaceId(req), user: getUserId(req), task: req.params.taskId, status: 'running' });
  if (!timer) return res.status(404).json({ success: false, message: 'No running timer found' });
  timer.status = 'paused';
  timer.pausedAt = new Date();
  await timer.save();
  res.json({ success: true, message: 'Timer paused', data: timer, timer });
});

const resumeTimer = asyncHandler(async (req, res) => {
  const timer = await ActiveTimer.findOne({ workspace: getWorkspaceId(req), user: getUserId(req), task: req.params.taskId, status: 'paused' });
  if (!timer) return res.status(404).json({ success: false, message: 'No paused timer found' });
  if (timer.pausedAt) timer.pausedDurationMinutes += Math.max(0, dayjs().diff(dayjs(timer.pausedAt), 'minute'));
  timer.status = 'running';
  timer.pausedAt = undefined;
  await timer.save();
  res.json({ success: true, message: 'Timer resumed', data: timer, timer });
});

const stopTimer = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  const timer = await ActiveTimer.findOne({ workspace, user: getUserId(req), task: req.params.taskId, status: { $in: ['running', 'paused'] } });
  if (!timer) return res.status(404).json({ success: false, message: 'No running timer found' });
  const settings = await timesheetService.getSettings(workspace);
  if (settings.requireDescription && !req.body.description?.trim()) {
    return res.status(400).json({ success: false, message: 'Description is required' });
  }

  const stoppedAt = new Date();
  const pausedMinutes = timer.pausedDurationMinutes + (timer.status === 'paused' && timer.pausedAt ? Math.max(0, dayjs(stoppedAt).diff(dayjs(timer.pausedAt), 'minute')) : 0);
  const durationMinutes = Math.max(1, dayjs(stoppedAt).diff(dayjs(timer.startedAt), 'minute') - pausedMinutes);
  const timeLog = await TimeLog.create({
    workspace,
    user: getUserId(req),
    department: req.workspaceDepartment,
    task: timer.task,
    project: timer.project,
    logDate: dayjs(timer.startedAt).startOf('day').toDate(),
    startTime: timer.startedAt,
    endTime: stoppedAt,
    durationMinutes,
    workType: req.body.workType || 'task_work',
    description: req.body.description,
    billable: Boolean(req.body.billable),
    source: 'timer',
    timerSession: { startedAt: timer.startedAt, stoppedAt, pausedDurationMinutes: pausedMinutes },
    approvalStatus: 'draft',
    createdBy: req.user?._id,
  });

  timer.status = 'stopped';
  await timer.save();
  await timesheetService.syncTimesheetForDate({ workspace, user: timeLog.user, department: timeLog.department, date: timeLog.logDate });
  await taskTimerService.recalculateTaskActualHours(timer.task);
  if (timer.project) await taskTimerService.recalculateProjectActualHours(timer.project);
  await taskActivityService.log({ workspace, task: timer.task, action: 'timer_stopped', message: 'Timer stopped', performedBy: req.user?._id });
  res.json({ success: true, message: 'Timer stopped and time log created', data: timeLog, timeLog });
});

const stopCurrentTimer = asyncHandler(async (req, res) => {
  const timer = await ActiveTimer.findOne({ workspace: getWorkspaceId(req), user: getUserId(req), status: { $in: ['running', 'paused'] } });
  if (!timer) return res.status(404).json({ success: false, message: 'No running timer found' });
  req.params.taskId = timer.task.toString();
  return stopTimer(req, res);
});

const remove = asyncHandler(async (req, res) => {
  const item = await Timesheet.findOne({ _id: getTimesheetId(req), workspace: getWorkspaceId(req) });
  if (!item) return res.status(404).json({ success: false, message: 'Timesheet not found' });
  await item.deleteOne();
  res.json({ success: true, message: 'Timesheet deleted' });
});

module.exports = {
  list,
  getAll: list,
  myTimesheets,
  current,
  create,
  getById,
  getOne: getById,
  update,
  submit,
  approve,
  reject,
  reopen,
  lock,
  unlock,
  pendingApprovals,
  missing,
  dashboard,
  workload,
  getSettings,
  updateSettings,
  activeTimer,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  stopCurrentTimer,
  remove,
  delete: remove,
};
