const dayjs = require('dayjs');
const workingDaysService = require('./workingDays.service');

function getResponsibleUsers(task, role) {
  if (!task) return [];
  if (['marketing', 'designer', 'content', 'assignee'].includes(role)) return task.assignedTo || [];
  if (role === 'requester') return [task.requestedBy].filter(Boolean);
  if (role === 'manager') return [task.assignedBy, task.createdBy].filter(Boolean);
  return [];
}

async function calculatePhases({ workspace, slaConfig, t0Date, task }) {
  const workspaceId = workspace?._id || workspace;
  const phases = [];
  let currentStartDate = dayjs(t0Date).startOf('day').toDate();
  const sorted = [...(slaConfig.phases || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  for (const phaseConfig of sorted) {
    const duration = Number(phaseConfig.durationWorkingDays || 0);
    const plannedStartDate = currentStartDate;
    const plannedEndDate =
      duration === 0
        ? plannedStartDate
        : await workingDaysService.addWorkingDays(workspaceId, plannedStartDate, duration);

    phases.push({
      phaseKey: phaseConfig.phaseKey,
      phaseName: phaseConfig.phaseName,
      order: phaseConfig.order,
      plannedStartDate,
      plannedEndDate,
      durationWorkingDays: duration,
      responsibleRole: phaseConfig.responsibleRole,
      responsibleUsers: getResponsibleUsers(task, phaseConfig.responsibleRole),
      status: phases.length === 0 ? 'in_progress' : 'pending',
      actualStartDate: phases.length === 0 ? plannedStartDate : undefined,
      requiresApproval: phaseConfig.requiresApproval,
      requiresFeedback: phaseConfig.requiresFeedback,
      feedbackDueDate: phaseConfig.requiresFeedback
        ? await workingDaysService.addWorkingDays(
            workspaceId,
            plannedEndDate,
            slaConfig.feedbackRules?.feedbackDueWorkingDays || 2
          )
        : null,
    });

    currentStartDate = plannedEndDate;
  }

  return phases;
}

function calculateOverallStatus(tracker) {
  const phases = tracker.phases || [];
  if (!phases.length) return 'not_started';
  if (tracker.overallStatus === 'on_hold' || tracker.overallStatus === 'cancelled') return tracker.overallStatus;
  if (phases.every((phase) => ['completed', 'skipped'].includes(phase.status))) return 'completed';
  if (phases.some((phase) => phase.status === 'delayed')) return 'breached';

  const now = new Date();
  const atRisk = phases.some(
    (phase) =>
      ['pending', 'in_progress'].includes(phase.status) &&
      phase.plannedEndDate &&
      dayjs(phase.plannedEndDate).diff(now, 'hour') <= 24
  );

  return atRisk ? 'at_risk' : 'on_track';
}

module.exports = {
  calculatePhases,
  calculateOverallStatus,
  getResponsibleUsers,
};
