const SLAConfig = require('../models/SLAConfig');
const SLAEscalation = require('../models/SLAEscalation');
const Task = require('../models/Task');
const Department = require('../models/Department');
const Workspace = require('../models/Workspace');
const notificationService = require('./notification.service');

async function resolveEscalationRecipients({ tracker, task, roles }) {
  const recipients = [];
  const populatedTask = task?._id
    ? task
    : await Task.findById(task || tracker.task)
        .populate('assignedTo', '_id')
        .populate('project')
        .populate('requestedByDepartment');

  for (const role of roles || []) {
    if (role === 'assignee') {
      (populatedTask.assignedTo || []).forEach((user) => recipients.push({ user: user._id || user, role }));
    }
    if (role === 'project_manager' && populatedTask.project?.manager) {
      recipients.push({ user: populatedTask.project.manager, role });
    }
    if (role === 'department_head') {
      const departmentId = populatedTask.requestedByDepartment?._id || populatedTask.requestedByDepartment;
      const department = departmentId ? await Department.findById(departmentId) : null;
      if (department?.head) recipients.push({ user: department.head, role });
    }
    if (role === 'admin') {
      const workspace = await Workspace.findById(tracker.workspace);
      (workspace?.members || [])
        .filter((member) => ['owner', 'admin'].includes(member.role) && member.isActive !== false)
        .forEach((member) => recipients.push({ user: member.user, role }));
    }
    if (role === 'top_management') {
      const managementDepartment = await Department.findOne({
        workspace: tracker.workspace,
        code: 'MGT',
        isActive: { $ne: false },
      });
      (managementDepartment?.members || []).forEach((member) => recipients.push({ user: member.user || member, role }));
    }
  }

  const unique = new Map();
  recipients.filter((item) => item.user).forEach((item) => unique.set(String(item.user), item));
  return Array.from(unique.values());
}

async function getSLAStakeholders(tracker) {
  const task = await Task.findById(tracker.task);
  if (!task) return [];
  const ids = [task.requestedBy, task.createdBy, task.assignedBy, ...(task.assignedTo || []), ...(task.watchers || [])].filter(Boolean);
  return [...new Set(ids.map(String))];
}

async function handleEscalation({ tracker, phase, delayDays }) {
  const slaConfig = await SLAConfig.findById(tracker.slaConfig);
  const rules = slaConfig?.escalationRules?.length
    ? slaConfig.escalationRules
    : [{ level: 1, afterDelayWorkingDays: 1, notifyRoles: ['assignee'], channels: { inApp: true, email: true } }];

  const rule = [...rules]
    .filter((item) => delayDays >= (item.afterDelayWorkingDays || 0))
    .sort((a, b) => (b.level || 0) - (a.level || 0))[0];

  if (!rule || tracker.escalationLevel >= rule.level) return null;

  const existingEscalation = await SLAEscalation.findOne({
    workspace: tracker.workspace,
    slaTracker: tracker._id,
    phaseKey: phase.phaseKey,
    level: rule.level,
  });
  if (existingEscalation) return existingEscalation;

  const task = await Task.findById(tracker.task).populate('assignedTo project requestedByDepartment');
  const recipients = await resolveEscalationRecipients({ tracker, task, roles: rule.notifyRoles });

  const escalation = await SLAEscalation.create({
    workspace: tracker.workspace,
    slaTracker: tracker._id,
    task: tracker.task,
    project: tracker.project,
    phaseKey: phase.phaseKey,
    phaseName: phase.phaseName,
    level: rule.level,
    delayDays,
    reason: `${phase.phaseName || phase.phaseKey} delayed by ${delayDays} working day(s)`,
    recipients: recipients.map((item) => ({
      user: item.user,
      role: item.role,
      notifiedAt: new Date(),
      channels: rule.channels,
    })),
    requiresCAPA: rule.requireCAPA || false,
    capaStatus: rule.requireCAPA ? 'pending' : 'not_required',
  });

  tracker.escalationLevel = rule.level;
  await tracker.save();

  await notificationService.notify({
    workspace: tracker.workspace,
    recipients: recipients.map((item) => item.user),
    type: 'sla_escalation',
    title: `SLA Escalation Level ${rule.level}`,
    message: `${phase.phaseName || phase.phaseKey} is delayed by ${delayDays} working day(s).`,
    refModel: 'SLAEscalation',
    refId: escalation._id,
    actionUrl: `/sla/escalations/${escalation._id}`,
    priority: 'urgent',
    channels: rule.channels,
    metadata: { phaseName: phase.phaseName, delayDays, escalationLevel: rule.level },
  });

  return escalation;
}

module.exports = {
  resolveEscalationRecipients,
  getSLAStakeholders,
  handleEscalation,
};
