const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const expenseNumberService = require('./expenseNumber.service');

async function createExpense(payload, user) {
  const budget = payload.budget
    ? await Budget.findOne({ _id: payload.budget, workspace: payload.workspace, status: { $in: ['approved', 'active', 'exhausted', 'over_budget'] }, isDeleted: { $ne: true } })
    : null;
  if (payload.budget && !budget) {
    const error = new Error('Active approved budget not found');
    error.statusCode = 404;
    throw error;
  }
  const totalAmount = Number(payload.totalAmount || (Number(payload.amount || 0) + Number(payload.taxAmount || 0)));
  return Expense.create({
    ...payload,
    expenseNumber: payload.expenseNumber || await expenseNumberService.generateExpenseNumber(payload.workspace),
    totalAmount,
    currency: payload.currency || budget?.currency || 'INR',
    requestedBy: payload.requestedBy || user?._id,
    createdBy: payload.createdBy || user?._id,
  });
}

module.exports = { createExpense };
