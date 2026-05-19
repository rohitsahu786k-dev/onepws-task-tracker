const asyncHandler = require('../utils/asyncHandler');
const Task = require('../models/Task');
const SLAConfig = require('../models/SLAConfig');
const SLATracker = require('../models/SLATracker');
const SLAEscalation = require('../models/SLAEscalation');
const SLAResetLog = require('../models/SLAResetLog');
const SLAActivity = require('../models/SLAActivity');
const { syncTaskEvent, syncSLAEvents, cancelSLAEvents, updateSLAPhaseEvent } = require('../services/calendar.service');
const notificationService = require('../services/notification.service');
const workingDaysService = require('../services/workingDays.service');
const slaCalculationService = require('../services/slaCalculation.service');
const slaTrackerService = require('../services/slaTracker.service');
const slaEscalationService = require('../services/slaEscalation.service');
const slaReportService = require('../services/slaReport.service');
const slaConfigService = require('../services/slaConfig.service');

const workspaceId = (req) => req.workspace._id;
const trackerId = (req) => req.params.trackerId || req.params.id;
const configId = (req) => req.params.configId || req.params.id;

async function logSLA(req, action, tracker, description, oldValue, newValue) {
  return SLAActivity.create({
    workspace: workspaceId(req),
    user: req.user?._id,
    action,
    refModel: 'SLATracker',
    refId: tracker?._id || tracker,
    description,
    oldValue,
    newValue,
  }).catch(() => null);
}

const getAll = asyncHandler(async (req, res) => {
  const trackers = await SLATracker.find({ workspace: workspaceId(req) })
    .populate('task', 'taskNumber title assignedTo project priority status')
    .populate('slaConfig', 'name deliverableType requestType')
    .sort({ createdAt: -1 });
  res.json({ success: true, trackers, data: trackers });
});

const create = asyncHandler(async (req, res) => {
  const tracker = await SLATracker.create({ ...req.body, workspace: workspaceId(req), createdBy: req.user._id });
  const task = tracker.task ? await Task.findById(tracker.task) : null;
  await syncSLAEvents(tracker, task);
  await logSLA(req, 'tracker_created', tracker, 'SLA tracker created');
  res.status(201).json({ success: true, tracker, data: tracker });
});

const getById = asyncHandler(async (req, res) => {
  const tracker = await SLATracker.findOne({ _id: trackerId(req), workspace: workspaceId(req) })
    .populate('task')
    .populate('slaConfig')
    .populate('phases.responsibleUsers', 'name firstName lastName email avatar');
  if (!tracker) return res.status(404).json({ success: false, message: 'SLA tracker not found' });
  res.json({ success: true, tracker, data: tracker });
});

const update = asyncHandler(async (req, res) => {
  const tracker = await SLATracker.findOneAndUpdate(
    { _id: trackerId(req), workspace: workspaceId(req) },
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!tracker) return res.status(404).json({ success: false, message: 'SLA tracker not found' });
  const task = tracker.task ? await Task.findById(tracker.task) : null;
  await syncSLAEvents(tracker, task);
  await logSLA(req, 'tracker_updated', tracker, 'SLA tracker updated');
  res.json({ success: true, tracker, data: tracker });
});

const remove = asyncHandler(async (req, res) => {
  const tracker = await SLATracker.findOne({ _id: trackerId(req), workspace: workspaceId(req) });
  if (!tracker) return res.status(404).json({ success: false, message: 'SLA tracker not found' });
  await cancelSLAEvents(tracker._id, 'SLA tracker deleted');
  await tracker.deleteOne();
  res.json({ success: true, message: 'SLA tracker deleted' });
});

const confirmT0 = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, workspace: workspaceId(req), isDeleted: { $ne: true } });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  const slaConfig =
    (req.body.slaConfig && await SLAConfig.findOne({ _id: req.body.slaConfig, workspace: workspaceId(req) })) ||
    await SLAConfig.findOne({
      workspace: workspaceId(req),
      deliverableType: req.body.deliverableType || task.deliverableType,
      requestType: req.body.requestType || task.requestType || 'new_work',
      isActive: { $ne: false },
    }).sort({ isDefault: -1, createdAt: -1 });

  if (!slaConfig) return res.status(404).json({ success: false, message: 'Matching SLA config not found' });

  const existing = await SLATracker.findOne({ workspace: workspaceId(req), task: task._id });
  if (existing) return res.status(409).json({ success: false, message: 'SLA tracker already exists for this task', data: existing });

  const tracker = await slaTrackerService.createSLATrackerForTask({
    workspace: req.workspace,
    task,
    slaConfig,
    t0Date: req.body.t0Date || new Date(),
    confirmedBy: req.user._id,
  });
  await logSLA(req, 't0_confirmed', tracker, 'T0 confirmed', null, tracker.t0Date);
  res.status(201).json({ success: true, message: 'T0 confirmed successfully', tracker, data: tracker });
});

const startPhase = asyncHandler(async (req, res) => {
  const tracker = await SLATracker.findOne({ _id: trackerId(req), workspace: workspaceId(req) });
  if (!tracker) return res.status(404).json({ success: false, message: 'SLA tracker not found' });
  const phase = tracker.phases.find((item) => item.phaseKey === req.params.phaseKey);
  if (!phase) return res.status(404).json({ success: false, message: 'SLA phase not found' });
  phase.status = 'in_progress';
  phase.actualStartDate = new Date();
  tracker.currentPhaseKey = phase.phaseKey;
  tracker.currentPhaseName = phase.phaseName;
  tracker.overallStatus = slaCalculationService.calculateOverallStatus(tracker);
  await tracker.save();
  await updateSLAPhaseEvent(tracker, phase, await Task.findById(tracker.task));
  await logSLA(req, 'phase_started', tracker, `${phase.phaseName} started`);
  res.json({ success: true, tracker, data: tracker });
});

const completePhase = asyncHandler(async (req, res) => {
  const tracker = await SLATracker.findOne({ _id: trackerId(req), workspace: workspaceId(req) });
  if (!tracker) return res.status(404).json({ success: false, message: 'SLA tracker not found' });
  const phase = tracker.phases.find((item) => item.phaseKey === req.params.phaseKey);
  if (!phase) return res.status(404).json({ success: false, message: 'SLA phase not found' });

  phase.actualEndDate = req.body.actualEndDate || new Date();
  phase.completedAt = new Date();
  phase.completedBy = req.user._id;
  const delayDays = await workingDaysService.calculateWorkingDayDelay(workspaceId(req), phase.plannedEndDate, phase.actualEndDate);
  phase.delayDays = delayDays;
  phase.status = delayDays > 0 ? 'delayed' : 'completed';

  await slaTrackerService.startNextPhase(tracker, phase.phaseKey);
  await tracker.save();
  await updateSLAPhaseEvent(tracker, phase, await Task.findById(tracker.task));
  await logSLA(req, 'phase_completed', tracker, `${phase.phaseName} completed`, null, { delayDays });
  res.json({ success: true, message: 'SLA phase completed successfully', tracker, data: tracker });
});

const skipPhase = asyncHandler(async (req, res) => {
  const tracker = await SLATracker.findOne({ _id: trackerId(req), workspace: workspaceId(req) });
  if (!tracker) return res.status(404).json({ success: false, message: 'SLA tracker not found' });
  const phase = tracker.phases.find((item) => item.phaseKey === req.params.phaseKey);
  if (!phase) return res.status(404).json({ success: false, message: 'SLA phase not found' });
  phase.status = 'skipped';
  phase.delayReason = req.body.reason;
  await slaTrackerService.startNextPhase(tracker, phase.phaseKey);
  await tracker.save();
  res.json({ success: true, tracker, data: tracker });
});

const requestFeedback = asyncHandler(async (req, res) => {
  const tracker = await SLATracker.findOne({ _id: trackerId(req), workspace: workspaceId(req) }).populate('slaConfig task');
  if (!tracker) return res.status(404).json({ success: false, message: 'SLA tracker not found' });
  const dueAt = await workingDaysService.addWorkingDays(
    workspaceId(req),
    new Date(),
    tracker.slaConfig?.feedbackRules?.feedbackDueWorkingDays || 2
  );
  tracker.feedback = {
    requestedAt: new Date(),
    dueAt,
    status: 'pending',
    requestedFrom: req.body.requestedFrom || [],
  };
  const phase = tracker.phases.find((item) => item.phaseKey === req.body.phaseKey);
  if (phase) phase.feedbackDueDate = dueAt;
  await tracker.save();
  await Task.findByIdAndUpdate(tracker.task._id, { status: 'waiting_for_feedback', 'feedback.required': true, 'feedback.requestedAt': new Date(), 'feedback.dueAt': dueAt, 'feedback.status': 'pending' });
  await notificationService.notify({
    workspace: workspaceId(req),
    sender: req.user._id,
    recipients: req.body.requestedFrom || [tracker.task.requestedBy].filter(Boolean),
    type: 'sla_feedback_requested',
    title: `Feedback requested: ${tracker.task.taskNumber}`,
    message: req.body.note || 'Please share consolidated feedback.',
    refModel: 'SLATracker',
    refId: tracker._id,
    actionUrl: `/sla/${tracker._id}`,
    channels: { inApp: true, email: true },
  });
  await logSLA(req, 'feedback_requested', tracker, 'Feedback requested');
  res.json({ success: true, tracker, data: tracker });
});

const submitFeedback = asyncHandler(async (req, res) => {
  const tracker = await SLATracker.findOne({ _id: trackerId(req), workspace: workspaceId(req) });
  if (!tracker) return res.status(404).json({ success: false, message: 'SLA tracker not found' });
  tracker.feedback.receivedAt = new Date();
  tracker.feedback.status = 'received';
  tracker.feedback.delayDays = await workingDaysService.calculateWorkingDayDelay(workspaceId(req), tracker.feedback.dueAt, tracker.feedback.receivedAt);
  const phase = tracker.phases.find((item) => item.phaseKey === req.body.phaseKey);
  if (phase) phase.feedbackReceivedAt = tracker.feedback.receivedAt;
  await tracker.save();
  await Task.findByIdAndUpdate(tracker.task, { status: 'in_progress', 'feedback.receivedAt': new Date(), 'feedback.status': 'received' });
  await logSLA(req, 'feedback_submitted', tracker, 'Feedback submitted', null, { changePercent: req.body.changePercent });
  res.json({ success: true, tracker, data: { tracker, t0ResetSuggested: Number(req.body.changePercent) > 30 } });
});

const resetT0 = asyncHandler(async (req, res) => {
  const tracker = await SLATracker.findOne({ _id: trackerId(req), workspace: workspaceId(req) });
  if (!tracker) return res.status(404).json({ success: false, message: 'SLA tracker not found' });
  const changePercent = Number(req.body.changePercent || 0);
  if (changePercent <= 30 && req.body.override !== true) {
    return res.status(400).json({ success: false, message: 'T0 reset is allowed only when change is more than 30%' });
  }
  if (!req.body.reason) return res.status(400).json({ success: false, message: 'Reason is required' });

  const oldT0Date = tracker.t0Date;
  const oldFinalDueDate = tracker.finalDueDate;
  const oldPhases = JSON.parse(JSON.stringify(tracker.phases || []));
  await cancelSLAEvents(tracker._id, 'T0 reset');

  const [slaConfig, task] = await Promise.all([SLAConfig.findById(tracker.slaConfig), Task.findById(tracker.task)]);
  const newPhases = await slaCalculationService.calculatePhases({
    workspace: req.workspace,
    slaConfig,
    t0Date: req.body.newT0Date || req.body.t0Date || new Date(),
    task,
  });

  tracker.t0Date = req.body.newT0Date || req.body.t0Date || new Date();
  tracker.phases = newPhases;
  tracker.finalDueDate = newPhases[newPhases.length - 1]?.plannedEndDate;
  tracker.currentPhaseKey = newPhases[0]?.phaseKey;
  tracker.currentPhaseName = newPhases[0]?.phaseName;
  tracker.isT0Reset = true;
  tracker.t0ResetCount = (tracker.t0ResetCount || 0) + 1;
  tracker.t0ResetReason = req.body.reason;
  tracker.t0ResetAt = new Date();
  tracker.t0ResetBy = req.user._id;
  tracker.resetHistory.push({ oldT0Date, newT0Date: tracker.t0Date, reason: req.body.reason, changePercent, resetBy: req.user._id, resetAt: new Date() });
  tracker.overallStatus = 'on_track';
  await tracker.save();

  await SLAResetLog.create({
    workspace: workspaceId(req),
    slaTracker: tracker._id,
    task: tracker.task,
    oldT0Date,
    newT0Date: tracker.t0Date,
    reason: req.body.reason,
    changePercent,
    oldFinalDueDate,
    newFinalDueDate: tracker.finalDueDate,
    oldPhases,
    newPhases,
    resetBy: req.user._id,
    approvedBy: req.body.approvedBy,
  });

  if (task) {
    task.dueDate = tracker.finalDueDate;
    task.targetDueDate = tracker.finalDueDate;
    await task.save();
    await syncTaskEvent(task);
  }
  await syncSLAEvents(tracker, task);
  await notificationService.notify({
    workspace: workspaceId(req),
    sender: req.user._id,
    recipients: await slaEscalationService.getSLAStakeholders(tracker),
    type: 'sla_t0_reset',
    title: 'SLA T0 Reset',
    message: `T0 has been reset due to ${changePercent}% change.`,
    refModel: 'SLATracker',
    refId: tracker._id,
    actionUrl: `/sla/${tracker._id}`,
    channels: { inApp: true, email: true },
    metadata: { oldT0Date, newT0Date: tracker.t0Date, changePercent, reason: req.body.reason },
  });
  await logSLA(req, 't0_reset', tracker, `T0 reset due to ${changePercent}% change`, oldT0Date, tracker.t0Date);
  res.json({ success: true, message: 'SLA T0 reset successfully', tracker, data: tracker });
});

const timeline = asyncHandler(async (req, res) => {
  const tracker = await SLATracker.findOne({ _id: trackerId(req), workspace: workspaceId(req) }).select('t0Date finalDueDate currentPhaseKey currentPhaseName phases feedback overallStatus totalDelayDays resetHistory');
  if (!tracker) return res.status(404).json({ success: false, message: 'SLA tracker not found' });
  res.json({ success: true, data: tracker });
});

const listTrackerEscalations = asyncHandler(async (req, res) => {
  const escalations = await SLAEscalation.find({ workspace: workspaceId(req), slaTracker: trackerId(req) }).sort({ createdAt: -1 });
  res.json({ success: true, escalations, data: escalations });
});

const listResetHistory = asyncHandler(async (req, res) => {
  const logs = await SLAResetLog.find({ workspace: workspaceId(req), slaTracker: trackerId(req) }).sort({ createdAt: -1 });
  res.json({ success: true, logs, data: logs });
});

const listEscalations = asyncHandler(async (req, res) => {
  const query = { workspace: workspaceId(req) };
  if (req.query.status) query.status = req.query.status;
  const escalations = await SLAEscalation.find(query).populate('task', 'taskNumber title').sort({ createdAt: -1 });
  res.json({ success: true, escalations, data: escalations });
});

const getEscalation = asyncHandler(async (req, res) => {
  const escalation = await SLAEscalation.findOne({ _id: req.params.escalationId, workspace: workspaceId(req) }).populate('task slaTracker');
  if (!escalation) return res.status(404).json({ success: false, message: 'Escalation not found' });
  res.json({ success: true, escalation, data: escalation });
});

const acknowledgeEscalation = asyncHandler(async (req, res) => {
  const escalation = await SLAEscalation.findOne({ _id: req.params.escalationId, workspace: workspaceId(req) });
  if (!escalation) return res.status(404).json({ success: false, message: 'Escalation not found' });
  escalation.status = 'acknowledged';
  escalation.acknowledgedBy = req.user._id;
  escalation.acknowledgedAt = new Date();
  if (req.body.note) escalation.resolutionNote = req.body.note;
  await escalation.save();
  res.json({ success: true, escalation, data: escalation });
});

const resolveEscalation = asyncHandler(async (req, res) => {
  const escalation = await SLAEscalation.findOne({ _id: req.params.escalationId, workspace: workspaceId(req) });
  if (!escalation) return res.status(404).json({ success: false, message: 'Escalation not found' });
  escalation.status = 'resolved';
  escalation.resolvedBy = req.user._id;
  escalation.resolvedAt = new Date();
  escalation.resolutionNote = req.body.resolutionNote;
  await escalation.save();
  res.json({ success: true, message: 'Escalation resolved successfully', escalation, data: escalation });
});

const ignoreEscalation = asyncHandler(async (req, res) => {
  const escalation = await SLAEscalation.findOneAndUpdate(
    { _id: req.params.escalationId, workspace: workspaceId(req) },
    { status: 'ignored', resolutionNote: req.body.note },
    { new: true }
  );
  if (!escalation) return res.status(404).json({ success: false, message: 'Escalation not found' });
  res.json({ success: true, escalation, data: escalation });
});

const dashboard = asyncHandler(async (req, res) => {
  const data = await slaReportService.getDashboard(workspaceId(req));
  res.json({ success: true, data });
});

const reports = asyncHandler(async (req, res) => {
  const trackers = await SLATracker.find({ workspace: workspaceId(req) }).populate('task', 'taskNumber title assignedTo requestedByDepartment').lean();
  res.json({ success: true, data: trackers });
});

const exportReport = asyncHandler(async (req, res) => {
  const trackers = await SLATracker.find({ workspace: workspaceId(req) }).populate('task', 'taskNumber title').lean();
  res.json({ success: true, format: req.params.format, data: trackers });
});

const configList = asyncHandler(async (req, res) => {
  await slaConfigService.ensureDefaultConfigs(workspaceId(req), req.user._id);
  const configs = await SLAConfig.find({ workspace: workspaceId(req), ...(req.query.isActive ? { isActive: req.query.isActive === 'true' } : {}) }).sort({ createdAt: -1 });
  res.json({ success: true, configs, data: configs });
});

const configCreate = asyncHandler(async (req, res) => {
  const config = await SLAConfig.create({ ...req.body, workspace: workspaceId(req), createdBy: req.user._id });
  res.status(201).json({ success: true, config, data: config });
});

const configGet = asyncHandler(async (req, res) => {
  const config = await SLAConfig.findOne({ _id: configId(req), workspace: workspaceId(req) });
  if (!config) return res.status(404).json({ success: false, message: 'SLA config not found' });
  res.json({ success: true, config, data: config });
});

const configUpdate = asyncHandler(async (req, res) => {
  const config = await SLAConfig.findOneAndUpdate({ _id: configId(req), workspace: workspaceId(req) }, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
  if (!config) return res.status(404).json({ success: false, message: 'SLA config not found' });
  res.json({ success: true, config, data: config });
});

const configRemove = asyncHandler(async (req, res) => {
  const config = await SLAConfig.findOneAndUpdate({ _id: configId(req), workspace: workspaceId(req) }, { isActive: false, updatedBy: req.user._id }, { new: true });
  if (!config) return res.status(404).json({ success: false, message: 'SLA config not found' });
  res.json({ success: true, message: 'SLA config deactivated', config, data: config });
});

const configActivate = asyncHandler(async (req, res) => {
  const config = await SLAConfig.findOneAndUpdate({ _id: configId(req), workspace: workspaceId(req) }, { isActive: true, updatedBy: req.user._id }, { new: true });
  if (!config) return res.status(404).json({ success: false, message: 'SLA config not found' });
  res.json({ success: true, config, data: config });
});

const configDeactivate = asyncHandler(async (req, res) => {
  const config = await SLAConfig.findOneAndUpdate({ _id: configId(req), workspace: workspaceId(req) }, { isActive: false, updatedBy: req.user._id }, { new: true });
  if (!config) return res.status(404).json({ success: false, message: 'SLA config not found' });
  res.json({ success: true, config, data: config });
});

const configSetDefault = asyncHandler(async (req, res) => {
  const config = await SLAConfig.findOne({ _id: configId(req), workspace: workspaceId(req) });
  if (!config) return res.status(404).json({ success: false, message: 'SLA config not found' });
  await SLAConfig.updateMany({ workspace: workspaceId(req), deliverableType: config.deliverableType, requestType: config.requestType }, { isDefault: false });
  config.isDefault = true;
  await config.save();
  res.json({ success: true, config, data: config });
});

const configClone = asyncHandler(async (req, res) => {
  const source = await SLAConfig.findOne({ _id: configId(req), workspace: workspaceId(req) }).lean();
  if (!source) return res.status(404).json({ success: false, message: 'SLA config not found' });
  delete source._id;
  delete source.createdAt;
  delete source.updatedAt;
  const config = await SLAConfig.create({ ...source, name: req.body.name || `${source.name} Copy`, isDefault: false, createdBy: req.user._id });
  res.status(201).json({ success: true, config, data: config });
});

module.exports = {
  getAll,
  create,
  getById,
  update,
  remove,
  confirmT0,
  startPhase,
  completePhase,
  skipPhase,
  requestFeedback,
  submitFeedback,
  resetT0,
  timeline,
  listTrackerEscalations,
  listResetHistory,
  listEscalations,
  getEscalation,
  acknowledgeEscalation,
  resolveEscalation,
  ignoreEscalation,
  dashboard,
  reports,
  exportReport,
  configList,
  configCreate,
  configGet,
  configUpdate,
  configRemove,
  configActivate,
  configDeactivate,
  configSetDefault,
  configClone,
};
