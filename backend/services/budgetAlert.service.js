const Budget = require('../models/Budget');
const notificationService = require('./notification.service');

async function getBudgetAlertRecipients(budget) {
  const recipients = [budget.createdBy, budget.approval?.approvedBy, ...(budget.approval?.approvers || []).map((item) => item.user)].filter(Boolean);
  return [...new Set(recipients.map(String))];
}

async function checkBudgetThresholds(budgetId) {
  const budget = await Budget.findById(budgetId);
  if (!budget) return null;
  const percent = budget.utilizationPercent || 0;
  const thresholds = [
    { key: 'threshold50', value: 50 },
    { key: 'threshold75', value: 75 },
    { key: 'threshold90', value: 90 },
    { key: 'threshold100', value: 100 },
  ];

  for (const threshold of thresholds) {
    if (budget.alertThresholds?.[threshold.key] && percent >= threshold.value && !budget.alertsSent?.[threshold.key]) {
      await notificationService.notify({
        workspace: budget.workspace,
        recipients: await getBudgetAlertRecipients(budget),
        type: 'budget_threshold_crossed',
        title: `Budget ${threshold.value}% Utilized: ${budget.budgetNumber}`,
        message: `${budget.title} has reached ${percent}% utilization.`,
        refModel: 'Budget',
        refId: budget._id,
        actionUrl: `/budget/${budget._id}`,
        priority: threshold.value >= 90 ? 'high' : 'medium',
        channels: { inApp: true, email: true },
        metadata: { budgetNumber: budget.budgetNumber, utilizationPercent: percent, threshold: threshold.value },
      });
      budget.alertsSent[threshold.key] = new Date();
      await budget.save();
    }
  }

  if (budget.spentAmount > budget.totalAmount && !budget.alertsSent?.overBudget) {
    await notificationService.notify({
      workspace: budget.workspace,
      recipients: await getBudgetAlertRecipients(budget),
      type: 'budget_overrun',
      title: `Budget Overrun: ${budget.budgetNumber}`,
      message: `${budget.title} has exceeded approved budget.`,
      refModel: 'Budget',
      refId: budget._id,
      actionUrl: `/budget/${budget._id}`,
      priority: 'urgent',
      channels: { inApp: true, email: true },
    });
    budget.alertsSent.overBudget = new Date();
    await budget.save();
  }
  return budget;
}

module.exports = { checkBudgetThresholds, getBudgetAlertRecipients };
