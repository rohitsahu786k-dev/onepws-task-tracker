const SLAConfig = require('../models/SLAConfig');

const DEFAULT_SLA_CONFIGS = [
  {
    name: 'Catalogue upto 20 pages',
    deliverableType: 'catalogue_upto_20_pages',
    requestType: 'new_work',
    totalWorkingDays: 15,
    phases: [
      { phaseKey: 't0_confirmation', phaseName: 'T0 Confirmation', order: 1, durationWorkingDays: 0, responsibleRole: 'marketing' },
      { phaseKey: 'kickoff_mom', phaseName: 'Kickoff Meeting + MOM', order: 2, durationWorkingDays: 1, responsibleRole: 'marketing' },
      { phaseKey: 'first_draft', phaseName: 'First Draft', order: 3, durationWorkingDays: 5, responsibleRole: 'designer' },
      { phaseKey: 'requester_feedback', phaseName: 'Requester Feedback', order: 4, durationWorkingDays: 2, responsibleRole: 'requester', requiresFeedback: true },
      { phaseKey: 'second_draft', phaseName: 'Second Draft', order: 5, durationWorkingDays: 3, responsibleRole: 'designer' },
      { phaseKey: 'final_approval', phaseName: 'Final Approval', order: 6, durationWorkingDays: 2, responsibleRole: 'approver', requiresApproval: true },
      { phaseKey: 'final_delivery', phaseName: 'Final Delivery / Print File', order: 7, durationWorkingDays: 2, responsibleRole: 'marketing' },
    ],
  },
  {
    name: 'Brochure',
    deliverableType: 'brochure',
    requestType: 'new_work',
    totalWorkingDays: 5,
    phases: [
      { phaseKey: 't0_confirmation', phaseName: 'T0 Confirmation', order: 1, durationWorkingDays: 0, responsibleRole: 'marketing' },
      { phaseKey: 'first_draft', phaseName: 'First Draft', order: 2, durationWorkingDays: 2, responsibleRole: 'designer' },
      { phaseKey: 'feedback', phaseName: 'Feedback', order: 3, durationWorkingDays: 1, responsibleRole: 'requester', requiresFeedback: true },
      { phaseKey: 'final_design', phaseName: 'Final Design', order: 4, durationWorkingDays: 1, responsibleRole: 'designer' },
      { phaseKey: 'final_delivery', phaseName: 'Final Delivery', order: 5, durationWorkingDays: 1, responsibleRole: 'marketing' },
    ],
  },
  {
    name: 'Flyer',
    deliverableType: 'flyer',
    requestType: 'new_work',
    totalWorkingDays: 2,
    phases: [
      { phaseKey: 'input_confirmation', phaseName: 'Input Confirmation', order: 1, durationWorkingDays: 0, responsibleRole: 'marketing' },
      { phaseKey: 'draft', phaseName: 'Draft', order: 2, durationWorkingDays: 1, responsibleRole: 'designer' },
      { phaseKey: 'final_delivery', phaseName: 'Final Delivery', order: 3, durationWorkingDays: 1, responsibleRole: 'marketing' },
    ],
  },
  {
    name: 'Social Media Post',
    deliverableType: 'social_media_post',
    requestType: 'new_work',
    totalWorkingDays: 1,
    phases: [
      { phaseKey: 'input_confirmation', phaseName: 'Input Confirmation', order: 1, durationWorkingDays: 0, responsibleRole: 'marketing' },
      { phaseKey: 'creative_caption', phaseName: 'Creative + Caption', order: 2, durationWorkingDays: 1, responsibleRole: 'designer' },
    ],
  },
  {
    name: 'PPT less than 20 pages',
    deliverableType: 'ppt_less_20_pages',
    requestType: 'new_work',
    totalWorkingDays: 5,
    phases: [
      { phaseKey: 'input_confirmation', phaseName: 'Input Confirmation', order: 1, durationWorkingDays: 0, responsibleRole: 'marketing' },
      { phaseKey: 'first_draft', phaseName: 'First Draft', order: 2, durationWorkingDays: 3, responsibleRole: 'designer' },
      { phaseKey: 'feedback', phaseName: 'Feedback', order: 3, durationWorkingDays: 1, responsibleRole: 'requester', requiresFeedback: true },
      { phaseKey: 'final_ppt', phaseName: 'Final PPT', order: 4, durationWorkingDays: 1, responsibleRole: 'marketing' },
    ],
  },
];

async function findMatchingConfig({ workspace, deliverableType, requestType = 'new_work' }) {
  return SLAConfig.findOne({ workspace, deliverableType, requestType, isActive: { $ne: false } }).sort({
    isDefault: -1,
    createdAt: -1,
  });
}

async function ensureDefaultConfigs(workspace, createdBy) {
  const count = await SLAConfig.countDocuments({ workspace });
  if (count) return SLAConfig.find({ workspace }).sort({ createdAt: -1 });

  await SLAConfig.insertMany(
    DEFAULT_SLA_CONFIGS.map((config, index) => ({
      ...config,
      workspace,
      isDefault: index === 0,
      isActive: true,
      createdBy,
      feedbackRules: {
        feedbackDueWorkingDays: 2,
        autoHoldAfterWorkingDays: 2,
        autoCloseAfterWorkingDays: 5,
        allowT0ResetAfterChangePercent: 30,
      },
      escalationRules: [
        { level: 1, afterDelayWorkingDays: 1, notifyRoles: ['assignee', 'project_manager'], channels: { inApp: true, email: true } },
        { level: 2, afterDelayWorkingDays: 2, notifyRoles: ['department_head', 'admin'], channels: { inApp: true, email: true } },
        { level: 3, afterDelayWorkingDays: 5, notifyRoles: ['top_management'], channels: { inApp: true, email: true } },
        { level: 4, afterDelayWorkingDays: 7, notifyRoles: ['admin', 'top_management'], channels: { inApp: true, email: true }, requireCAPA: true },
      ],
    }))
  );

  return SLAConfig.find({ workspace }).sort({ createdAt: -1 });
}

module.exports = { DEFAULT_SLA_CONFIGS, findMatchingConfig, ensureDefaultConfigs };
