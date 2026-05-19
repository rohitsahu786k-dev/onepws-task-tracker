const dayjs = require('dayjs');
const asyncHandler = require('../utils/asyncHandler');
const Task = require('../models/Task');
const TaskStage = require('../models/TaskStage');
const TaskComment = require('../models/TaskComment');
const TaskActivity = require('../models/TaskActivity');
const TaskTimer = require('../models/TaskTimer');
const TaskDependency = require('../models/TaskDependency');
const TaskTemplate = require('../models/TaskTemplate');
const { syncTaskEvent, cancelTaskEvent } = require('../services/calendar.service');
const notificationService = require('../services/notification.service');
const projectProgressService = require('../services/projectProgress.service');
const { getWorkStartStatus } = require('../services/taskWorkStart.service');
const taskNumberService = require('../services/taskNumber.service');
const taskStageService = require('../services/taskStage.service');
const taskActivityService = require('../services/taskActivity.service');
const taskDependencyService = require('../services/taskDependency.service');
const taskReportService = require('../services/taskReport.service');
const workingDaysService = require('../services/workingDays.service');

const idParam = (req) => req.params.taskId || req.params.id;
const workspaceId = (req) => req.workspace?._id || req.params.wid || req.body.workspace || req.query.workspace;

function applyTaskVisibilityFilter(query, req) {
  if (req.user?.globalRole === 'super_admin' || req.user?.role === 'super_admin') return query;
  if (['owner', 'admin', 'super_admin'].includes(req.workspaceRole)) return query;

  if (req.workspaceRole === 'manager') {
    query.$or = [
      { department: req.workspaceDepartment },
      { requestedByDepartment: req.workspaceDepartment },
      { assignedTo: req.user._id },
      { createdBy: req.user._id },
      { requestedBy: req.user._id },
      { watchers: req.user._id },
    ];
    return query;
  }

  if (req.workspaceRole === 'member') {
    query.$or = [
      { assignedTo: req.user._id },
      { requestedBy: req.user._id },
      { createdBy: req.user._id },
      { watchers: req.user._id },
    ];
    return query;
  }

  if (req.workspaceRole === 'viewer') {
    query.visibility = { $ne: 'private' };
  }

  return query;
}

function buildTaskQuery(req, extra = {}) {
  const query = { workspace: workspaceId(req), isDeleted: { $ne: true }, ...extra };
  const {
    search,
    status,
    stage,
    priority,
    taskType,
    deliverableType,
    project,
    assignee,
    assignedTo,
    requestedByDepartment,
    createdBy,
    delayStatus,
    approvalStatus,
    feedbackStatus,
    tag,
    dueToday,
    dueTomorrow,
    overdue,
    watchedByMe,
    myTasks,
    start,
    end,
  } = req.query;

  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [
      { taskNumber: regex },
      { title: regex },
      { description: regex },
      { tags: regex },
    ];
  }
  if (status) query.status = { $in: String(status).split(',') };
  if (stage) query.stage = stage;
  if (priority) query.priority = priority;
  if (taskType) query.taskType = taskType;
  if (deliverableType) query.deliverableType = deliverableType;
  if (project) query.project = project;
  if (assignee || assignedTo) query.assignedTo = assignee || assignedTo;
  if (requestedByDepartment) query.requestedByDepartment = requestedByDepartment;
  if (createdBy) query.createdBy = createdBy;
  if (delayStatus) query.delayStatus = delayStatus;
  if (approvalStatus) query['approval.status'] = approvalStatus;
  if (feedbackStatus) query['feedback.status'] = feedbackStatus;
  if (tag) query.tags = tag;
  if (watchedByMe === 'true') query.watchers = req.user._id;
  if (myTasks === 'true') query.assignedTo = req.user._id;
  if (start || end) {
    query.dueDate = {};
    if (start) query.dueDate.$gte = dayjs(start).startOf('day').toDate();
    if (end) query.dueDate.$lte = dayjs(end).endOf('day').toDate();
  }
  if (dueToday === 'true') {
    query.dueDate = { $gte: dayjs().startOf('day').toDate(), $lte: dayjs().endOf('day').toDate() };
  }
  if (dueTomorrow === 'true') {
    query.dueDate = {
      $gte: dayjs().add(1, 'day').startOf('day').toDate(),
      $lte: dayjs().add(1, 'day').endOf('day').toDate(),
    };
  }
  if (overdue === 'true') {
    query.status = { $nin: ['closed', 'cancelled'] };
    query.dueDate = { $lt: dayjs().startOf('day').toDate() };
  }

  return applyTaskVisibilityFilter(query, req);
}

async function getTaskOr404(req, res) {
  const task = await Task.findOne({ _id: idParam(req), workspace: workspaceId(req), isDeleted: { $ne: true } });
  if (!task) {
    res.status(404).json({ success: false, message: 'Task not found' });
    return null;
  }
  return task;
}

function recalculateChecklistProgress(task) {
  if (!task.checklist?.length) return;
  const done = task.checklist.filter((item) => item.isCompleted).length;
  task.progressPercent = Math.round((done / task.checklist.length) * 100);
}

async function calculateAndApplyDelay(task, actualClosingDate) {
  if (!task.dueDate || !actualClosingDate) return;
  const delayDays = await workingDaysService.calculateWorkingDayDelay(task.workspace, task.dueDate, actualClosingDate);
  task.delayDays = delayDays;
  task.delayInDays = delayDays;
  if (delayDays > 0) task.delayStatus = 'delayed';
  else if (dayjs(actualClosingDate).isBefore(dayjs(task.dueDate), 'day')) task.delayStatus = 'early';
  else task.delayStatus = 'on_time';
}

const getAll = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 200);
  const skip = (page - 1) * limit;
  const query = buildTaskQuery(req);

  const [tasks, total] = await Promise.all([
    Task.find(query)
      .populate('stage', 'name key color mappedStatus')
      .populate('assignedTo', 'name firstName lastName email avatar')
      .populate('project', 'name title projectNumber')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Task.countDocuments(query),
  ]);

  res.json({ success: true, tasks, data: tasks, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

const create = asyncHandler(async (req, res) => {
  const workspace = workspaceId(req);
  const taskNumber = req.body.taskNumber || (await taskNumberService.generateTaskNumber(workspace));
  const defaultStage = await taskStageService.getDefaultStage(workspace, req.user._id);
  const approval = req.body.approval?.required
    ? { ...req.body.approval, status: req.body.approval.status || 'pending' }
    : req.body.approval || { required: false, status: 'not_required' };

  const task = await Task.create({
    ...req.body,
    workspace,
    taskNumber,
    requestedBy: req.body.requestedBy || req.user._id,
    assignedBy: req.user._id,
    stage: req.body.stage || defaultStage?._id,
    status: req.body.status || defaultStage?.mappedStatus || 'open',
    targetDueDate: req.body.targetDueDate || req.body.dueDate,
    approval,
    createdBy: req.user._id,
  });

  await syncTaskEvent(task);
  if (task.assignedTo?.length) {
    await notificationService.notify({
      workspace,
      sender: req.user._id,
      recipients: task.assignedTo,
      type: 'task_assigned',
      title: `Task Assigned: ${task.taskNumber}`,
      message: `${task.title} has been assigned to you.`,
      refModel: 'Task',
      refId: task._id,
      actionUrl: `/tasks/${task._id}`,
      priority: task.priority,
      channels: { inApp: true, email: true },
      metadata: { taskNumber: task.taskNumber, taskTitle: task.title, dueDate: task.dueDate, priority: task.priority },
    });
  }
  if (task.project && projectProgressService.recalculateProjectProgress) {
    await projectProgressService.recalculateProjectProgress(task.project).catch(() => null);
  }
  await taskActivityService.log({
    workspace,
    task: task._id,
    action: 'created',
    message: `Task ${task.taskNumber} created`,
    performedBy: req.user._id,
  });

  res.status(201).json({ success: true, message: 'Task created successfully', task, data: task });
});

const getById = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: idParam(req), workspace: workspaceId(req), isDeleted: { $ne: true } })
    .populate('stage')
    .populate('assignedTo watchers requestedBy createdBy', 'name firstName lastName email avatar')
    .populate('project')
    .populate('slaTracker');
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  const [workStart, comments, activities, timers] = await Promise.all([
    getWorkStartStatus(task).catch(() => ({})),
    TaskComment.find({ workspace: workspaceId(req), task: task._id, isDeleted: { $ne: true } }).sort({ createdAt: 1 }),
    TaskActivity.find({ workspace: workspaceId(req), task: task._id }).sort({ createdAt: -1 }),
    TaskTimer.find({ workspace: workspaceId(req), task: task._id }).sort({ startedAt: -1 }),
  ]);
  const payload = { ...task.toObject(), comments, activities, timers, ...workStart };
  res.json({ success: true, task: payload, data: payload });
});

const getWorkStart = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  const workStart = await getWorkStartStatus(task);
  res.json({ success: true, data: workStart });
});

const update = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  if (task.isLocked && !['admin', 'owner', 'super_admin'].includes(req.workspaceRole)) {
    return res.status(423).json({ success: false, message: 'Task is locked' });
  }
  if (req.body.startDate && req.body.dueDate && dayjs(req.body.dueDate).isBefore(dayjs(req.body.startDate), 'day')) {
    return res.status(400).json({ success: false, message: 'Due date cannot be before start date' });
  }

  Object.assign(task, req.body, { updatedBy: req.user._id });
  if (req.body.dueDate) task.targetDueDate = req.body.targetDueDate || req.body.dueDate;
  recalculateChecklistProgress(task);
  await task.save();
  await syncTaskEvent(task);
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'updated', performedBy: req.user._id });
  res.json({ success: true, task, data: task });
});

const remove = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  task.isDeleted = true;
  task.deletedAt = new Date();
  task.deletedBy = req.user._id;
  await task.save();
  await cancelTaskEvent(task, 'Task deleted');
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'deleted', performedBy: req.user._id });
  res.json({ success: true, message: 'Task deleted' });
});

const restore = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: idParam(req), workspace: workspaceId(req), isDeleted: true });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  task.isDeleted = false;
  task.deletedAt = undefined;
  task.deletedBy = undefined;
  await task.save();
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'restored', performedBy: req.user._id });
  res.json({ success: true, task, data: task });
});

const changeStage = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  if (task.isLocked && !['admin', 'owner', 'super_admin'].includes(req.workspaceRole)) {
    return res.status(423).json({ success: false, message: 'Task is locked' });
  }

  const newStage = await TaskStage.findOne({ _id: req.body.stage, workspace: workspaceId(req), isActive: true });
  if (!newStage) return res.status(404).json({ success: false, message: 'Stage not found' });
  if (newStage.allowedRolesToMove?.length && !newStage.allowedRolesToMove.includes(req.workspaceRole)) {
    return res.status(403).json({ success: false, message: 'You cannot move tasks to this stage' });
  }
  if (['in_progress', 'in_process'].includes(newStage.mappedStatus) && await taskDependencyService.hasOpenBlockingDependencies(task)) {
    return res.status(409).json({ success: false, message: 'Task is blocked by an open dependency' });
  }

  const oldStage = task.stage;
  const oldStatus = task.status;
  task.stage = newStage._id;
  task.status = newStage.mappedStatus || task.status;
  if (newStage.automation?.setSubmittedAt) task.submittedAt = new Date();
  if (newStage.automation?.setClosedAt) {
    task.closedAt = new Date();
    task.actualClosingDate = task.actualClosingDate || new Date();
    await calculateAndApplyDelay(task, task.actualClosingDate);
  }
  if (newStage.automation?.lockTask) {
    task.isLocked = true;
    task.lockedAt = new Date();
    task.lockedBy = req.user._id;
  }
  await task.save();
  await syncTaskEvent(task);
  await notificationService.notify({
    workspace: workspaceId(req),
    sender: req.user._id,
    recipients: [...(task.assignedTo || []), ...(task.watchers || [])],
    type: 'task_stage_changed',
    title: `Task Stage Changed: ${task.taskNumber}`,
    message: `${task.title} moved to ${newStage.name}.`,
    refModel: 'Task',
    refId: task._id,
    actionUrl: `/tasks/${task._id}`,
    channels: { inApp: true },
    metadata: { taskNumber: task.taskNumber, oldStatus, newStatus: task.status },
  });
  await taskActivityService.log({
    workspace: workspaceId(req),
    task: task._id,
    action: 'stage_changed',
    oldValue: oldStage,
    newValue: newStage._id,
    performedBy: req.user._id,
  });
  res.json({ success: true, message: 'Task stage updated successfully', task, data: task });
});

const updateStatus = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  const oldValue = task.status;
  task.status = req.body.status;
  if (['in_progress', 'in_process'].includes(task.status)) {
    const workStart = await getWorkStartStatus(task).catch(() => ({ canStartWork: true }));
    if (!workStart.canStartWork) {
      return res.status(409).json({ success: false, message: 'Work start blocked until kickoff meeting is completed and MOM is signed', data: workStart });
    }
  }
  await task.save();
  await syncTaskEvent(task);
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'status_changed', oldValue, newValue: task.status, performedBy: req.user._id });
  res.json({ success: true, task, data: task });
});

const assign = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  const oldValue = task.assignedTo;
  task.assignedTo = req.body.assignedTo || req.body.users || [];
  task.assignedBy = req.user._id;
  await task.save();
  await syncTaskEvent(task);
  await notificationService.notify({
    workspace: workspaceId(req),
    sender: req.user._id,
    recipients: task.assignedTo,
    type: 'task_assigned',
    title: `Task Assigned: ${task.taskNumber}`,
    message: `${task.title} has been assigned to you.`,
    refModel: 'Task',
    refId: task._id,
    actionUrl: `/tasks/${task._id}`,
    channels: { inApp: true, email: true },
  });
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'assigned', oldValue, newValue: task.assignedTo, performedBy: req.user._id });
  res.json({ success: true, task, data: task });
});

const updatePriority = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  const oldValue = task.priority;
  task.priority = req.body.priority;
  await task.save();
  await syncTaskEvent(task);
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'priority_changed', oldValue, newValue: task.priority, performedBy: req.user._id });
  res.json({ success: true, task, data: task });
});

const updateDueDate = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  if (task.startDate && dayjs(req.body.dueDate).isBefore(dayjs(task.startDate), 'day')) {
    return res.status(400).json({ success: false, message: 'Due date cannot be before start date' });
  }
  const oldValue = task.dueDate;
  task.dueDate = req.body.dueDate;
  task.targetDueDate = req.body.targetDueDate || req.body.dueDate;
  await task.save();
  await syncTaskEvent(task);
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'due_date_changed', oldValue, newValue: task.dueDate, performedBy: req.user._id });
  res.json({ success: true, task, data: task });
});

const hold = asyncHandler(async (req, res) => {
  if (!req.body.holdReason && !req.body.reason) return res.status(400).json({ success: false, message: 'Hold reason is required' });
  const task = await getTaskOr404(req, res);
  if (!task) return;
  task.status = 'on_hold';
  task.holdReason = req.body.holdReason || req.body.reason;
  task.holdStartDate = new Date();
  await task.save();
  await syncTaskEvent(task);
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'put_on_hold', message: task.holdReason, performedBy: req.user._id });
  res.json({ success: true, task, data: task });
});

const close = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  if (task.approval?.required && task.approval.status !== 'approved') {
    return res.status(400).json({ success: false, message: 'Approval required task cannot close without approval' });
  }
  const openSubtasks = await Task.countDocuments({ workspace: workspaceId(req), parentTask: task._id, status: { $nin: ['closed', 'cancelled'] }, isDeleted: { $ne: true } });
  if (openSubtasks) return res.status(409).json({ success: false, message: 'Parent task cannot close while subtasks are open' });

  task.status = 'closed';
  task.closedAt = new Date();
  task.actualClosingDate = req.body.actualClosingDate || new Date();
  task.progressPercent = 100;
  task.isLocked = true;
  task.lockedAt = new Date();
  task.lockedBy = req.user._id;
  await calculateAndApplyDelay(task, task.actualClosingDate);
  await task.save();
  await syncTaskEvent(task);
  if (task.project && projectProgressService.recalculateProjectProgress) await projectProgressService.recalculateProjectProgress(task.project).catch(() => null);
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'closed', message: req.body.closingNote, performedBy: req.user._id });
  res.json({ success: true, task, data: task });
});

const reopen = asyncHandler(async (req, res) => {
  if (!req.body.reason) return res.status(400).json({ success: false, message: 'Reason is required' });
  const task = await getTaskOr404(req, res);
  if (!task) return;
  task.status = 'reopened';
  task.isLocked = false;
  task.lockedAt = undefined;
  task.lockedBy = undefined;
  await task.save();
  await syncTaskEvent(task);
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'reopened', message: req.body.reason, performedBy: req.user._id });
  res.json({ success: true, task, data: task });
});

const cancel = asyncHandler(async (req, res) => {
  if (!req.body.reason && !req.body.cancellationReason) return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
  const task = await getTaskOr404(req, res);
  if (!task) return;
  task.status = 'cancelled';
  task.cancelledAt = new Date();
  task.cancellationReason = req.body.reason || req.body.cancellationReason;
  task.isLocked = true;
  task.lockedAt = new Date();
  task.lockedBy = req.user._id;
  await task.save();
  await cancelTaskEvent(task, task.cancellationReason);
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'cancelled', message: task.cancellationReason, performedBy: req.user._id });
  res.json({ success: true, task, data: task });
});

const listVariant = (extraQuery) => asyncHandler(async (req, res) => {
  const query = buildTaskQuery(req, extraQuery(req));
  const tasks = await Task.find(query).sort({ dueDate: 1, createdAt: -1 });
  res.json({ success: true, tasks, data: tasks });
});

const getKanban = asyncHandler(async (req, res) => {
  const [stages, tasks] = await Promise.all([
    taskStageService.ensureDefaultStages(workspaceId(req), req.user._id),
    Task.find(buildTaskQuery(req)).populate('assignedTo', 'name firstName lastName avatar').sort({ dueDate: 1 }),
  ]);
  const columns = stages.map((stage) => ({
    stage,
    tasks: tasks.filter((task) => String(task.stage || '') === String(stage._id)),
    count: tasks.filter((task) => String(task.stage || '') === String(stage._id)).length,
  }));
  res.json({ success: true, data: { columns, stages, tasks } });
});

const getCalendar = asyncHandler(async (req, res) => {
  const tasks = await Task.find(buildTaskQuery(req)).select('taskNumber title dueDate startDate priority status assignedTo project requestedByDepartment');
  const events = tasks.filter((task) => task.dueDate).map((task) => ({
    id: task._id,
    title: `Due: ${task.taskNumber} - ${task.title}`,
    startDate: task.dueDate,
    endDate: task.dueDate,
    allDay: true,
    eventType: 'task',
    status: task.status,
    priority: task.priority,
    task,
  }));
  res.json({ success: true, events, data: events });
});

const addChecklistItem = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  task.checklist.push({ title: req.body.title, order: req.body.order ?? task.checklist.length + 1 });
  recalculateChecklistProgress(task);
  await task.save();
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'checklist_updated', performedBy: req.user._id });
  res.status(201).json({ success: true, task, data: task.checklist });
});

const updateChecklistItem = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  const item = task.checklist.id(req.params.itemId);
  if (!item) return res.status(404).json({ success: false, message: 'Checklist item not found' });
  Object.assign(item, req.body);
  if (req.body.isCompleted === true) {
    item.completedBy = req.user._id;
    item.completedAt = new Date();
  }
  recalculateChecklistProgress(task);
  await task.save();
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'checklist_updated', performedBy: req.user._id });
  res.json({ success: true, task, data: item });
});

const deleteChecklistItem = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  const item = task.checklist.id(req.params.itemId);
  if (!item) return res.status(404).json({ success: false, message: 'Checklist item not found' });
  item.deleteOne();
  recalculateChecklistProgress(task);
  await task.save();
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'checklist_updated', performedBy: req.user._id });
  res.json({ success: true, task, data: task.checklist });
});

const toggleChecklistItem = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  const item = task.checklist.id(req.params.itemId);
  if (!item) return res.status(404).json({ success: false, message: 'Checklist item not found' });
  item.isCompleted = !item.isCompleted;
  item.completedBy = item.isCompleted ? req.user._id : undefined;
  item.completedAt = item.isCompleted ? new Date() : undefined;
  recalculateChecklistProgress(task);
  await task.save();
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'checklist_updated', performedBy: req.user._id });
  res.json({ success: true, task, data: item });
});

const createSubtask = asyncHandler(async (req, res) => {
  const parent = await getTaskOr404(req, res);
  if (!parent) return;
  const taskNumber = await taskNumberService.generateTaskNumber(workspaceId(req));
  const defaultStage = await taskStageService.getDefaultStage(workspaceId(req), req.user._id);
  const subtask = await Task.create({
    ...req.body,
    workspace: workspaceId(req),
    taskNumber,
    parentTask: parent._id,
    project: req.body.project || parent.project,
    requestedBy: req.user._id,
    requestedByDepartment: req.body.requestedByDepartment || parent.requestedByDepartment,
    assignedBy: req.user._id,
    stage: req.body.stage || defaultStage?._id,
    status: req.body.status || defaultStage?.mappedStatus || 'open',
    createdBy: req.user._id,
  });
  parent.subtasks.addToSet(subtask._id);
  await parent.save();
  await syncTaskEvent(subtask);
  await taskActivityService.log({ workspace: workspaceId(req), task: parent._id, action: 'subtask_created', newValue: subtask._id, performedBy: req.user._id });
  res.status(201).json({ success: true, task: subtask, data: subtask });
});

const listSubtasks = asyncHandler(async (req, res) => {
  const parent = await getTaskOr404(req, res);
  if (!parent) return;
  const tasks = await Task.find({ workspace: workspaceId(req), parentTask: parent._id, isDeleted: { $ne: true } }).sort({ createdAt: 1 });
  res.json({ success: true, tasks, data: tasks });
});

const listComments = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  const query = { workspace: workspaceId(req), task: task._id, isDeleted: { $ne: true } };
  if (['viewer'].includes(req.workspaceRole)) query.isInternal = { $ne: true };
  const comments = await TaskComment.find(query).populate('createdBy mentions', 'name firstName lastName email avatar').sort({ createdAt: 1 });
  res.json({ success: true, comments, data: comments });
});

const addComment = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  const comment = await TaskComment.create({
    workspace: workspaceId(req),
    task: task._id,
    parentComment: req.body.parentComment,
    message: req.body.message || req.body.comment,
    mentions: req.body.mentions || [],
    attachments: req.body.attachments || [],
    isInternal: req.body.isInternal,
    commentType: req.body.commentType || 'comment',
    createdBy: req.user._id,
  });
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'comment_added', message: 'Comment added', performedBy: req.user._id });
  if (comment.mentions?.length) {
    await notificationService.notify({
      workspace: workspaceId(req),
      sender: req.user._id,
      recipients: comment.mentions,
      type: 'mention',
      title: `You were mentioned in ${task.taskNumber}`,
      message: `${req.user.name || req.user.email || 'A user'} mentioned you in a task comment.`,
      refModel: 'Task',
      refId: task._id,
      actionUrl: `/tasks/${task._id}?comment=${comment._id}`,
      channels: { inApp: true, email: true },
    });
  }
  res.status(201).json({ success: true, message: 'Comment added successfully', comment, data: comment });
});

const updateComment = asyncHandler(async (req, res) => {
  const comment = await TaskComment.findOne({ _id: req.params.commentId, workspace: workspaceId(req), task: idParam(req), isDeleted: { $ne: true } });
  if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
  if (String(comment.createdBy) !== String(req.user._id) && !['admin', 'owner', 'super_admin'].includes(req.workspaceRole)) {
    return res.status(403).json({ success: false, message: 'You can only edit your own comment' });
  }
  comment.message = req.body.message || req.body.comment || comment.message;
  comment.comment = comment.message;
  comment.isEdited = true;
  comment.editedAt = new Date();
  comment.updatedBy = req.user._id;
  await comment.save();
  res.json({ success: true, comment, data: comment });
});

const deleteComment = asyncHandler(async (req, res) => {
  const comment = await TaskComment.findOne({ _id: req.params.commentId, workspace: workspaceId(req), task: idParam(req), isDeleted: { $ne: true } });
  if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
  if (String(comment.createdBy) !== String(req.user._id) && !['admin', 'owner', 'super_admin'].includes(req.workspaceRole)) {
    return res.status(403).json({ success: false, message: 'You can only delete your own comment' });
  }
  comment.isDeleted = true;
  comment.deletedAt = new Date();
  await comment.save();
  res.json({ success: true, message: 'Comment deleted' });
});

const listAttachments = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  res.json({ success: true, attachments: task.attachments || [], data: task.attachments || [] });
});

const addAttachment = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  const attachment = { ...req.body, uploadedBy: req.user._id, uploadedAt: new Date() };
  task.attachments.push(attachment);
  await task.save();
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'attachment_added', newValue: attachment, performedBy: req.user._id });
  res.status(201).json({ success: true, attachments: task.attachments, data: task.attachments });
});

const deleteAttachment = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  const attachment = task.attachments.id(req.params.attachmentId);
  if (!attachment) return res.status(404).json({ success: false, message: 'Attachment not found' });
  attachment.deleteOne();
  await task.save();
  res.json({ success: true, attachments: task.attachments, data: task.attachments });
});

const listDependencies = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  const dependencies = await TaskDependency.find({ workspace: workspaceId(req), task: task._id }).populate('dependsOnTask dependencyTask', 'taskNumber title status');
  res.json({ success: true, dependencies, data: dependencies });
});

const addDependency = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  const dependencyTaskId = req.body.task || req.body.dependsOnTask || req.body.dependencyTask;
  if (!dependencyTaskId) return res.status(400).json({ success: false, message: 'Dependency task is required' });
  if (await taskDependencyService.hasCircularDependency(workspaceId(req), task._id, dependencyTaskId)) {
    return res.status(409).json({ success: false, message: 'Circular dependency is not allowed' });
  }
  task.dependencies.addToSet({ task: dependencyTaskId, type: req.body.type || req.body.dependencyType || 'blocked_by' });
  await task.save();
  const dependency = await TaskDependency.findOneAndUpdate(
    { workspace: workspaceId(req), task: task._id, dependsOnTask: dependencyTaskId },
    {
      workspace: workspaceId(req),
      task: task._id,
      dependsOnTask: dependencyTaskId,
      dependencyTask: dependencyTaskId,
      dependencyType: req.body.type || req.body.dependencyType || 'blocked_by',
      createdBy: req.user._id,
    },
    { new: true, upsert: true, runValidators: true }
  );
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'dependency_added', newValue: dependencyTaskId, performedBy: req.user._id });
  res.status(201).json({ success: true, dependency, data: dependency });
});

const deleteDependency = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  task.dependencies = task.dependencies.filter((item) => String(item._id) !== String(req.params.dependencyId) && String(item.task) !== String(req.params.dependencyId));
  await task.save();
  await TaskDependency.deleteOne({ workspace: workspaceId(req), task: task._id, $or: [{ _id: req.params.dependencyId }, { dependsOnTask: req.params.dependencyId }] });
  res.json({ success: true, dependencies: task.dependencies, data: task.dependencies });
});

const requestRevision = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  task.revisionCount = (task.revisionCount || 0) + 1;
  task.revisionNumber = `R${task.revisionCount}`;
  task.status = 'reopened';
  if (req.body.dueDate) task.dueDate = req.body.dueDate;
  if (Array.isArray(req.body.attachments)) task.attachments.push(...req.body.attachments);
  await task.save();
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'reopened', message: req.body.reason, newValue: { revisionNumber: task.revisionNumber, changePercent: req.body.changePercent }, performedBy: req.user._id });
  res.json({ success: true, task, data: { task, t0ResetSuggested: Number(req.body.changePercent) > 30 } });
});

const requestApproval = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  task.approval.required = true;
  task.approval.status = 'pending';
  task.approval.approvers = req.body.approvers || task.approval.approvers || [];
  await task.save();
  await notificationService.notify({
    workspace: workspaceId(req),
    sender: req.user._id,
    recipients: task.approval.approvers.map((item) => item.user).filter(Boolean),
    type: 'task_approval_requested',
    title: `Approval requested: ${task.taskNumber}`,
    message: `${task.title} needs your approval.`,
    refModel: 'Task',
    refId: task._id,
    actionUrl: `/tasks/${task._id}`,
    channels: { inApp: true, email: true },
  });
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'approval_requested', performedBy: req.user._id });
  res.json({ success: true, task, data: task });
});

const approve = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  const approver = task.approval.approvers.find((item) => String(item.user) === String(req.user._id));
  if (approver) {
    approver.status = 'approved';
    approver.comment = req.body.comment;
    approver.respondedAt = new Date();
  }
  if (!task.approval.approvers.length || task.approval.approvers.every((item) => item.status === 'approved')) {
    task.approval.status = 'approved';
  }
  await task.save();
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'approved', message: req.body.comment, performedBy: req.user._id });
  res.json({ success: true, task, data: task });
});

const reject = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  const approver = task.approval.approvers.find((item) => String(item.user) === String(req.user._id));
  if (approver) {
    approver.status = 'rejected';
    approver.comment = req.body.comment;
    approver.respondedAt = new Date();
  }
  task.approval.status = 'rejected';
  task.status = 'reopened';
  await task.save();
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'rejected', message: req.body.comment, performedBy: req.user._id });
  res.json({ success: true, task, data: task });
});

const requestFeedback = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  task.feedback.required = true;
  task.feedback.requestedAt = new Date();
  task.feedback.dueAt = req.body.dueAt || await workingDaysService.addWorkingDays(workspaceId(req), new Date(), 2);
  task.feedback.status = 'pending';
  task.status = 'waiting_for_feedback';
  await task.save();
  await syncTaskEvent(task);
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'updated', message: 'Feedback requested', performedBy: req.user._id });
  res.json({ success: true, task, data: task });
});

const submitFeedback = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  task.feedback.receivedAt = new Date();
  task.feedback.status = 'received';
  task.status = 'in_progress';
  await task.save();
  await addComment({ ...req, body: { message: req.body.feedbackText || req.body.message, commentType: 'feedback', attachments: req.body.attachments || [] } }, res);
});

const markFeedbackReceived = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  task.feedback.receivedAt = new Date();
  task.feedback.status = 'received';
  await task.save();
  res.json({ success: true, task, data: task });
});

const startTimer = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  const running = await TaskTimer.findOne({ workspace: workspaceId(req), task: task._id, user: req.user._id, status: 'running' });
  if (running) return res.status(409).json({ success: false, message: 'Timer already running', data: running });
  const timer = await TaskTimer.create({ workspace: workspaceId(req), task: task._id, user: req.user._id, startedAt: new Date(), description: req.body.description, createdBy: req.user._id });
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'timer_started', performedBy: req.user._id });
  res.status(201).json({ success: true, timer, data: timer });
});

const stopTimer = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  const timer = await TaskTimer.findOne({ workspace: workspaceId(req), task: task._id, user: req.user._id, status: 'running' }).sort({ startedAt: -1 });
  if (!timer) return res.status(404).json({ success: false, message: 'No running timer found' });
  timer.stoppedAt = new Date();
  timer.status = 'stopped';
  timer.durationSeconds = Math.max(Math.round((timer.stoppedAt - timer.startedAt) / 1000), 0);
  timer.durationMinutes = Math.ceil(timer.durationSeconds / 60);
  timer.description = req.body.description || timer.description;
  await timer.save();
  task.actualHours = Number(((task.actualHours || 0) + timer.durationMinutes / 60).toFixed(2));
  task.loggedHours = task.actualHours;
  await task.save();
  await taskActivityService.log({ workspace: workspaceId(req), task: task._id, action: 'timer_stopped', newValue: timer.durationMinutes, performedBy: req.user._id });
  res.json({ success: true, timer, data: timer });
});

const addTimeLog = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  const durationMinutes = Number(req.body.durationMinutes || req.body.minutes || 0);
  const timer = await TaskTimer.create({
    workspace: workspaceId(req),
    task: task._id,
    user: req.body.user || req.user._id,
    startedAt: req.body.startedAt || new Date(),
    stoppedAt: req.body.stoppedAt || new Date(),
    durationMinutes,
    description: req.body.description,
    source: 'manual',
    status: 'stopped',
    createdBy: req.user._id,
  });
  task.actualHours = Number(((task.actualHours || 0) + durationMinutes / 60).toFixed(2));
  task.loggedHours = task.actualHours;
  await task.save();
  res.status(201).json({ success: true, timer, data: timer });
});

const listTimeLogs = asyncHandler(async (req, res) => {
  const task = await getTaskOr404(req, res);
  if (!task) return;
  const timers = await TaskTimer.find({ workspace: workspaceId(req), task: task._id }).populate('user', 'name firstName lastName email avatar').sort({ startedAt: -1 });
  res.json({ success: true, timers, data: timers });
});

const deleteTimeLog = asyncHandler(async (req, res) => {
  const timer = await TaskTimer.findOne({ _id: req.params.logId, workspace: workspaceId(req), task: idParam(req) });
  if (!timer) return res.status(404).json({ success: false, message: 'Time log not found' });
  await timer.deleteOne();
  res.json({ success: true, message: 'Time log deleted' });
});

const bulkUpdate = asyncHandler(async (req, res) => {
  const ids = req.body.taskIds || req.body.ids || [];
  const update = req.body.update || {};
  const result = await Task.updateMany({ _id: { $in: ids }, workspace: workspaceId(req), isDeleted: { $ne: true } }, { ...update, updatedBy: req.user._id });
  res.json({ success: true, data: result });
});

const bulkDelete = asyncHandler(async (req, res) => {
  const ids = req.body.taskIds || req.body.ids || [];
  const result = await Task.updateMany({ _id: { $in: ids }, workspace: workspaceId(req) }, { isDeleted: true, deletedAt: new Date(), deletedBy: req.user._id });
  res.json({ success: true, data: result });
});

const bulkAssign = asyncHandler(async (req, res) => {
  const ids = req.body.taskIds || req.body.ids || [];
  const result = await Task.updateMany({ _id: { $in: ids }, workspace: workspaceId(req) }, { assignedTo: req.body.assignedTo || [], assignedBy: req.user._id });
  res.json({ success: true, data: result });
});

const bulkStageChange = asyncHandler(async (req, res) => {
  const stage = await TaskStage.findOne({ _id: req.body.stage, workspace: workspaceId(req) });
  if (!stage) return res.status(404).json({ success: false, message: 'Stage not found' });
  const ids = req.body.taskIds || req.body.ids || [];
  const result = await Task.updateMany({ _id: { $in: ids }, workspace: workspaceId(req) }, { stage: stage._id, status: stage.mappedStatus, updatedBy: req.user._id });
  res.json({ success: true, data: result });
});

const importTemplate = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: ['Title', 'Description', 'Task Type', 'Project Code', 'Requested Department', 'Assigned To Email', 'Priority', 'Start Date', 'Due Date', 'Estimated Hours', 'Tags'],
  });
});

const importTasks = asyncHandler(async (req, res) => {
  res.status(501).json({ success: false, message: 'Task import parser is not configured yet' });
});

const exportTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find(buildTaskQuery(req)).lean();
  res.json({ success: true, format: req.params.format || req.path.split('/').pop(), data: tasks });
});

const reports = asyncHandler(async (req, res) => {
  const metrics = await taskReportService.getMetrics(workspaceId(req));
  res.json({ success: true, data: metrics });
});

const createFromTemplate = asyncHandler(async (req, res) => {
  const template = await TaskTemplate.findOne({ _id: req.params.templateId, workspace: workspaceId(req), isActive: { $ne: false } });
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
  req.body = {
    ...(template.defaultFields?.toObject?.() || {}),
    ...req.body,
    taskType: req.body.taskType || template.taskType,
    deliverableType: req.body.deliverableType || template.deliverableType,
    priority: req.body.priority || template.defaultPriority,
    estimatedHours: req.body.estimatedHours || template.defaultEstimatedHours,
    assignedTo: req.body.assignedTo || template.defaultAssignees,
    checklist: req.body.checklist || template.defaultChecklist,
    approval: req.body.approval || { required: template.approvalRequired, status: template.approvalRequired ? 'pending' : 'not_required' },
  };
  return create(req, res);
});

module.exports = {
  getAll,
  create,
  getById,
  getWorkStart,
  update,
  remove,
  restore,
  changeStage,
  updateStatus,
  assign,
  updatePriority,
  updateDueDate,
  hold,
  close,
  reopen,
  cancel,
  my: listVariant((req) => ({ assignedTo: req.user._id })),
  dueToday: listVariant(() => ({ dueDate: { $gte: dayjs().startOf('day').toDate(), $lte: dayjs().endOf('day').toDate() } })),
  dueTomorrow: listVariant(() => ({ dueDate: { $gte: dayjs().add(1, 'day').startOf('day').toDate(), $lte: dayjs().add(1, 'day').endOf('day').toDate() } })),
  overdue: listVariant(() => ({ dueDate: { $lt: dayjs().startOf('day').toDate() }, status: { $nin: ['closed', 'cancelled'] } })),
  getKanban,
  getCalendar,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  toggleChecklistItem,
  createSubtask,
  listSubtasks,
  listComments,
  addComment,
  updateComment,
  deleteComment,
  listAttachments,
  addAttachment,
  deleteAttachment,
  listDependencies,
  addDependency,
  deleteDependency,
  requestRevision,
  requestApproval,
  approve,
  reject,
  requestFeedback,
  submitFeedback,
  markFeedbackReceived,
  startTimer,
  stopTimer,
  addTimeLog,
  listTimeLogs,
  deleteTimeLog,
  bulkUpdate,
  bulkDelete,
  bulkAssign,
  bulkStageChange,
  importTemplate,
  importTasks,
  exportTasks,
  reports,
  createFromTemplate,
};
