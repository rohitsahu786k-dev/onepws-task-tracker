const asyncHandler = require('../utils/asyncHandler');
const Expense = require('../models/Expense');
const { syncExpenseEvent } = require('../services/calendar.service');

const getAll = asyncHandler(async (req, res) => {
  const query = {};
  if (req.params.wid || req.query.workspace) query.workspace = req.params.wid || req.query.workspace;
  const expenses = await Expense.find(query).sort({ paymentDate: 1, createdAt: -1 });
  res.json({ success: true, expenses, data: expenses });
});

const create = asyncHandler(async (req, res) => {
  const workspaceId = req.params.wid || req.body.workspace;
  const expense = await Expense.create({ ...req.body, workspace: workspaceId, createdBy: req.user._id });
  await syncExpenseEvent(expense);
  res.status(201).json({ success: true, expense, data: expense });
});

const getById = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
  res.json({ success: true, expense, data: expense });
});

const update = asyncHandler(async (req, res) => {
  const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
  await syncExpenseEvent(expense);
  res.json({ success: true, expense, data: expense });
});

const remove = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
  const CalendarEvent = require('../models/CalendarEvent');
  await CalendarEvent.findOneAndUpdate(
    { workspace: expense.workspace, refModel: 'Expense', refId: expense._id, eventType: 'expense' },
    { status: 'cancelled', 'metadata.cancelledReason': 'Expense deleted' }
  );
  await expense.deleteOne();
  res.json({ success: true, message: 'Expense deleted' });
});

module.exports = { getAll, create, getById, update, remove };
