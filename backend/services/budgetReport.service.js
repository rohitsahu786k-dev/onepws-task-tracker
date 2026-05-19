const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

async function getDashboard(workspace) {
  const budgets = await Budget.find({ workspace, isDeleted: { $ne: true } }).lean();
  const expenses = await Expense.find({ workspace, isDeleted: { $ne: true } }).lean();
  const totalApprovedBudget = budgets.filter((b) => ['approved', 'active', 'exhausted', 'over_budget', 'closed'].includes(b.status)).reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spentAmount || 0), 0);
  const pendingExpenseApproval = expenses.filter((e) => e.status === 'pending_approval').reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);
  return {
    totalApprovedBudget,
    totalSpent,
    totalRemaining: totalApprovedBudget - totalSpent,
    pendingExpenseApproval,
    overBudgetCount: budgets.filter((b) => b.status === 'over_budget').length,
    budgetUtilizationPercent: totalApprovedBudget > 0 ? Number(((totalSpent / totalApprovedBudget) * 100).toFixed(2)) : 0,
    expensesThisMonth: expenses.filter((e) => new Date(e.expenseDate).getMonth() === new Date().getMonth()).length,
    paymentsPending: expenses.filter((e) => e.paymentStatus !== 'paid' && e.status === 'approved').length,
  };
}

module.exports = { getDashboard };
