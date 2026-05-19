const Budget = require('../models/Budget');
const budgetNumberService = require('./budgetNumber.service');

async function createBudget(payload, user) {
  const categories = payload.categories || [];
  const allocatedCategoryTotal = categories.reduce((sum, category) => sum + Number(category.allocatedAmount || 0), 0);
  if (allocatedCategoryTotal > Number(payload.totalAmount || 0)) {
    const error = new Error('Category allocation cannot exceed total budget amount');
    error.statusCode = 400;
    throw error;
  }
  return Budget.create({
    ...payload,
    budgetNumber: payload.budgetNumber || await budgetNumberService.generateBudgetNumber(payload.workspace),
    allocatedAmount: allocatedCategoryTotal || payload.totalAmount,
    remainingAmount: payload.totalAmount,
    categories: categories.map((category) => ({
      ...category,
      spentAmount: 0,
      remainingAmount: category.allocatedAmount,
      utilizationPercent: 0,
    })),
    createdBy: payload.createdBy || user?._id,
  });
}

module.exports = { createBudget };
