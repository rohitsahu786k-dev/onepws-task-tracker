const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

async function recalculateBudgetCategories(budget, approvedExpenses) {
  budget.categories = (budget.categories || []).map((category) => {
    const spentAmount = approvedExpenses
      .filter((expense) => expense.expenseCategory === category.categoryKey)
      .reduce((sum, expense) => sum + Number(expense.totalAmount || 0), 0);
    const remainingAmount = Number(category.allocatedAmount || 0) - spentAmount;
    const utilizationPercent = category.allocatedAmount > 0 ? Number(((spentAmount / category.allocatedAmount) * 100).toFixed(2)) : 0;
    return {
      ...(category.toObject?.() || category),
      spentAmount,
      remainingAmount,
      utilizationPercent,
    };
  });
}

async function recalculateBudget(budgetId) {
  if (!budgetId) return null;
  const budget = await Budget.findById(budgetId);
  if (!budget) return null;

  const [approvedExpenses, pendingExpenses] = await Promise.all([
    Expense.find({ budget: budgetId, status: { $in: ['approved', 'paid'] }, isDeleted: { $ne: true } }),
    Expense.find({ budget: budgetId, status: 'pending_approval', isDeleted: { $ne: true } }),
  ]);

  const spentAmount = approvedExpenses.reduce((sum, expense) => sum + Number(expense.totalAmount || 0), 0);
  const pendingExpenseAmount = pendingExpenses.reduce((sum, expense) => sum + Number(expense.totalAmount || 0), 0);
  const remainingAmount = Number(budget.totalAmount || 0) - spentAmount;
  const utilizationPercent = budget.totalAmount > 0 ? Number(((spentAmount / budget.totalAmount) * 100).toFixed(2)) : 0;

  budget.spentAmount = spentAmount;
  budget.pendingExpenseAmount = pendingExpenseAmount;
  budget.committedAmount = spentAmount + pendingExpenseAmount;
  budget.remainingAmount = remainingAmount;
  budget.utilizationPercent = utilizationPercent;
  if (spentAmount > budget.totalAmount) budget.status = 'over_budget';
  else if (remainingAmount <= 0 && spentAmount > 0) budget.status = 'exhausted';
  else if (budget.status === 'approved') budget.status = 'active';
  await recalculateBudgetCategories(budget, approvedExpenses);
  await budget.save();
  return budget;
}

module.exports = { recalculateBudget, recalculateBudgetCategories };
