const asyncHandler = require('../utils/asyncHandler');
const Budget = require('../models/Budget');
const { syncBudgetEvent } = require('../services/calendar.service');

const getAll = asyncHandler(async (req, res) => {
  const query = {};
  if (req.params.wid || req.query.workspace) query.workspace = req.params.wid || req.query.workspace;
  const budgets = await Budget.find(query).sort({ createdAt: -1 });
  res.json({ success: true, budgets, data: budgets });
});

const create = asyncHandler(async (req, res) => {
  const workspaceId = req.params.wid || req.body.workspace;
  const budget = await Budget.create({ ...req.body, workspace: workspaceId, createdBy: req.user._id });
  await syncBudgetEvent(budget);
  res.status(201).json({ success: true, budget, data: budget });
});

const getById = asyncHandler(async (req, res) => {
  const budget = await Budget.findById(req.params.id);
  if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
  res.json({ success: true, budget, data: budget });
});

const update = asyncHandler(async (req, res) => {
  const budget = await Budget.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
  await syncBudgetEvent(budget);
  res.json({ success: true, budget, data: budget });
});

const remove = asyncHandler(async (req, res) => {
  const budget = await Budget.findById(req.params.id);
  if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
  const CalendarEvent = require('../models/CalendarEvent');
  await CalendarEvent.findOneAndUpdate(
    { workspace: budget.workspace, refModel: 'Budget', refId: budget._id, eventType: 'budget' },
    { status: 'cancelled', 'metadata.cancelledReason': 'Budget deleted' }
  );
  await budget.deleteOne();
  res.json({ success: true, message: 'Budget deleted' });
});

module.exports = { getAll, create, getById, update, remove };
