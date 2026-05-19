const notificationService = require('./notification.service');

async function notifyPhaseCompleted(tracker, phase) {
  return notificationService.notify({
    workspace: tracker.workspace,
    recipients: phase.responsibleUsers || [],
    type: 'sla_phase_completed',
    title: `SLA Phase Completed: ${phase.phaseName}`,
    message: `${phase.phaseName} has been completed.`,
    refModel: 'SLATracker',
    refId: tracker._id,
    actionUrl: `/sla/${tracker._id}`,
    channels: { inApp: true },
  });
}

module.exports = {
  notify: notificationService.notify,
  notifyPhaseCompleted,
};
