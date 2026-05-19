const SLATracker = require('../models/SLATracker');
const Task = require('../models/Task');
const SLAConfig = require('../models/SLAConfig');
const { syncTaskEvent, syncSLAEvents, updateSLAPhaseEvent } = require('./calendar.service');
const slaCalculationService = require('./slaCalculation.service');

async function createSLATrackerForTask({ workspace, task, slaConfig, t0Date, confirmedBy }) {
  const phases = await slaCalculationService.calculatePhases({ workspace, slaConfig, t0Date, task });
  const finalDueDate = phases[phases.length - 1]?.plannedEndDate || t0Date;

  const tracker = await SLATracker.create({
    workspace: workspace._id || workspace,
    task: task._id,
    project: task.project,
    intakeForm: task.intakeForm,
    slaConfig: slaConfig._id,
    deliverableType: slaConfig.deliverableType,
    requestType: slaConfig.requestType,
    t0Date,
    t0ConfirmedBy: confirmedBy,
    t0ConfirmedAt: new Date(),
    finalDueDate,
    currentPhaseKey: phases[0]?.phaseKey,
    currentPhaseName: phases[0]?.phaseName,
    phases,
    overallStatus: 'on_track',
    createdBy: confirmedBy,
  });

  task.slaTracker = tracker._id;
  task.dueDate = finalDueDate;
  task.targetDueDate = finalDueDate;
  await task.save();

  await syncSLAEvents(tracker, task);
  await syncTaskEvent(task);

  return tracker;
}

async function startNextPhase(tracker, completedPhaseKey) {
  const phases = tracker.phases || [];
  const completedIndex = phases.findIndex((phase) => phase.phaseKey === completedPhaseKey);
  if (completedIndex === -1) return tracker;

  const nextPhase = phases[completedIndex + 1];
  if (nextPhase && nextPhase.status === 'pending') {
    nextPhase.status = 'in_progress';
    nextPhase.actualStartDate = new Date();
    tracker.currentPhaseKey = nextPhase.phaseKey;
    tracker.currentPhaseName = nextPhase.phaseName;
    tracker.currentPhase = nextPhase.phaseKey;
  }

  tracker.totalDelayDays = phases.reduce((sum, phase) => sum + (phase.delayDays || 0), 0);
  tracker.overallStatus = slaCalculationService.calculateOverallStatus(tracker);
  if (tracker.overallStatus === 'completed') tracker.completedAt = new Date();
  return tracker;
}

async function syncPhaseEvent(tracker, phase) {
  const task = tracker.task?._id ? tracker.task : await Task.findById(tracker.task);
  return updateSLAPhaseEvent(tracker, phase, task);
}

async function findConfigForTask(workspace, task, requestType, configId) {
  if (configId) return SLAConfig.findOne({ _id: configId, workspace });
  return SLAConfig.findOne({
    workspace,
    deliverableType: task.deliverableType,
    requestType: requestType || task.requestType || 'new_work',
    isActive: { $ne: false },
  }).sort({ isDefault: -1, createdAt: -1 });
}

module.exports = {
  createSLATrackerForTask,
  startNextPhase,
  syncPhaseEvent,
  findConfigForTask,
  calculateOverallStatus: slaCalculationService.calculateOverallStatus,
};
