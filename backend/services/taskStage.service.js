const TaskStage = require('../models/TaskStage');

const DEFAULT_TASK_STAGES = [
  { name: 'Open', key: 'open', order: 1, mappedStatus: 'open', color: '#2563eb', isDefault: true },
  { name: 'In Progress', key: 'in_progress', order: 2, mappedStatus: 'in_progress', color: '#7c3aed' },
  { name: 'Internal Review', key: 'internal_review', order: 3, mappedStatus: 'in_review', color: '#f97316' },
  { name: 'Waiting For Input', key: 'waiting_for_input', order: 4, mappedStatus: 'waiting_for_input', color: '#eab308' },
  { name: 'Waiting For Feedback', key: 'waiting_for_feedback', order: 5, mappedStatus: 'waiting_for_feedback', color: '#ca8a04' },
  { name: 'On Hold', key: 'on_hold', order: 6, mappedStatus: 'on_hold', color: '#64748b' },
  {
    name: 'Submitted',
    key: 'submitted',
    order: 7,
    mappedStatus: 'submitted',
    color: '#16a34a',
    automation: { setSubmittedAt: true, notifyRequester: true },
  },
  {
    name: 'Closed',
    key: 'closed',
    order: 8,
    mappedStatus: 'closed',
    color: '#15803d',
    isFinal: true,
    automation: { setClosedAt: true, lockTask: true },
  },
  { name: 'Cancelled', key: 'cancelled', order: 9, mappedStatus: 'cancelled', color: '#dc2626', isFinal: true },
];

async function ensureDefaultStages(workspace, createdBy) {
  const existingCount = await TaskStage.countDocuments({ workspace });
  if (existingCount) return TaskStage.find({ workspace, isActive: true }).sort({ order: 1 });

  await TaskStage.insertMany(
    DEFAULT_TASK_STAGES.map((stage) => ({
      ...stage,
      workspace,
      isSystem: true,
      createdBy,
    }))
  );

  return TaskStage.find({ workspace, isActive: true }).sort({ order: 1 });
}

async function getDefaultStage(workspace, createdBy) {
  let stage = await TaskStage.findOne({ workspace, isDefault: true, isActive: true }).sort({ order: 1 });
  if (!stage) {
    await ensureDefaultStages(workspace, createdBy);
    stage = await TaskStage.findOne({ workspace, isDefault: true, isActive: true }).sort({ order: 1 });
  }
  return stage;
}

module.exports = {
  DEFAULT_TASK_STAGES,
  ensureDefaultStages,
  getDefaultStage,
};
