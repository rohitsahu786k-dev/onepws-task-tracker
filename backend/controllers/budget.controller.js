const asyncHandler = require('../utils/asyncHandler');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const BudgetRevision = require('../models/BudgetRevision');
const Project = require('../models/Project');
const { syncBudgetEvent } = require('../services/calendar.service');
const notificationService = require('../services/notification.service');
const budgetService = require('../services/budget.service');
const budgetUtilizationService = require('../services/budgetUtilization.service');
const budgetAlertService = require('../services/budgetAlert.service');
const budgetReportService = require('../services/budgetReport.service');

const workspaceId = (req) => req.workspace._id;
const budgetId = (req) => req.params.budgetId || req.params.id;

function buildBudgetQuery(req, extra = {}) {
  const query = { workspace: workspaceId(req), isDeleted: { $ne: true }, ...extra };
  if (req.query.status) query.status = req.query.status;
  if (req.query.budgetType) query.budgetType = req.query.budgetType;
  if (req.query.project) query.project = req.query.project;
  if (req.query.department) query.department = req.query.department;
  if (req.query.fiscalYear) query.fiscalYear = req.query.fiscalYear;
  return query;
}

async function getBudgetOr404(req, res) {
  const budget = await Budget.findOne({ _id: budgetId(req), workspace: workspaceId(req), isDeleted: { $ne: true } });
  if (!budget) {
    res.status(404).json({ success: false, message: 'Budget not found' });
    return null;
  }
  return budget;
}

const getAll = asyncHandler(async (req, res) => {
  const budgets = await Budget.find(buildBudgetQuery(req)).populate('project department').sort({ createdAt: -1 });
  res.json({ success: true, budgets, data: budgets });
});

const create = asyncHandler(async (req, res) => {
  if (req.body.startDate && req.body.endDate && new Date(req.body.endDate) < new Date(req.body.startDate)) {
    return res.status(400).json({ success: false, message: 'End date must be after start date' });
  }
  const budget = await budgetService.createBudget({
    ...req.body,
    workspace: workspaceId(req),
    currency: req.body.currency || req.workspace?.settings?.currency || 'INR',
  }, req.user);
  await syncBudgetEvent(budget);
  res.status(201).json({ success: true, message: 'Budget created successfully', budget, data: budget });
});

const getById = asyncHandler(async (req, res) => {
  const budget = await Budget.findOne({ _id: budgetId(req), workspace: workspaceId(req), isDeleted: { $ne: true } }).populate('project department campaign task createdBy', 'name title email firstName lastName');
  if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
  const [expenses, payments, revisions] = await Promise.all([
    Expense.find({ workspace: workspaceId(req), budget: budget._id, isDeleted: { $ne: true } }).sort({ expenseDate: -1 }),
    Payment.find({ workspace: workspaceId(req), budget: budget._id }).sort({ paymentDate: -1 }),
    BudgetRevision.find({ workspace: workspaceId(req), budget: budget._id }).sort({ createdAt: -1 }),
  ]);
  res.json({ success: true, budget: { ...budget.toObject(), expenses, payments, revisions }, data: { ...budget.toObject(), expenses, payments, revisions } });
});

const update = asyncHandler(async (req, res) => {
  const budget = await getBudgetOr404(req, res);
  if (!budget) return;
  if (budget.isLocked && !['admin', 'owner', 'super_admin'].includes(req.workspaceRole)) {
    return res.status(423).json({ success: false, message: 'Budget is locked during approval' });
  }
  Object.assign(budget, req.body, { updatedBy: req.user._id });
  await budget.save();
  await budgetUtilizationService.recalculateBudget(budget._id);
  await syncBudgetEvent(budget);
  res.json({ success: true, budget, data: budget });
});

const remove = asyncHandler(async (req, res) => {
  const budget = await getBudgetOr404(req, res);
  if (!budget) return;
  budget.isDeleted = true;
  budget.deletedAt = new Date();
  budget.deletedBy = req.user._id;
  await budget.save();
  res.json({ success: true, message: 'Budget deleted' });
});

const submitApproval = asyncHandler(async (req, res) => {
  const budget = await getBudgetOr404(req, res);
  if (!budget) return;
  if (!budget.approval?.approvers?.length) return res.status(400).json({ success: false, message: 'At least one approver is required' });
  budget.status = 'pending_approval';
  budget.approval.status = 'pending';
  budget.approval.submittedAt = new Date();
  budget.isLocked = true;
  await budget.save();
  await notificationService.notify({
    workspace: workspaceId(req),
    sender: req.user._id,
    recipients: budget.approval.approvers.map((item) => item.user).filter(Boolean),
    type: 'budget_approval_requested',
    title: `Budget Approval Required: ${budget.budgetNumber}`,
    message: `${budget.title} requires your approval.`,
    refModel: 'Budget',
    refId: budget._id,
    actionUrl: `/budget/${budget._id}`,
    priority: 'high',
    channels: { inApp: true, email: true },
    metadata: { budgetNumber: budget.budgetNumber, amount: budget.totalAmount },
  });
  res.json({ success: true, message: 'Budget submitted for approval', budget, data: budget });
});

const approve = asyncHandler(async (req, res) => {
  const budget = await getBudgetOr404(req, res);
  if (!budget) return;
  const approver = budget.approval.approvers.find((item) => item.user?.toString() === req.user._id.toString());
  if (!approver) return res.status(403).json({ success: false, message: 'You are not an approver for this budget' });
  approver.status = 'approved';
  approver.comment = req.body.comment;
  approver.respondedAt = new Date();
  if (budget.approval.approvers.every((item) => item.status === 'approved')) {
    budget.approval.status = 'approved';
    budget.approval.approvedAt = new Date();
    budget.approval.approvedBy = req.user._id;
    budget.approvedAt = new Date();
    budget.approvedBy = req.user._id;
    budget.status = 'active';
    budget.isLocked = false;
    if (budget.project) await Project.findByIdAndUpdate(budget.project, { budget: budget._id, estimatedBudget: budget.totalAmount }).catch(() => null);
  }
  await budget.save();
  await notificationService.notify({
    workspace: workspaceId(req),
    sender: req.user._id,
    recipients: [budget.createdBy].filter(Boolean),
    type: 'budget_approved',
    title: `Budget Approved: ${budget.budgetNumber}`,
    message: `${budget.title} has been approved.`,
    refModel: 'Budget',
    refId: budget._id,
    actionUrl: `/budget/${budget._id}`,
    channels: { inApp: true, email: true },
  });
  res.json({ success: true, message: 'Budget approved successfully', budget, data: budget });
});

const reject = asyncHandler(async (req, res) => {
  const budget = await getBudgetOr404(req, res);
  if (!budget) return;
  const approver = budget.approval.approvers.find((item) => item.user?.toString() === req.user._id.toString());
  if (!approver) return res.status(403).json({ success: false, message: 'You are not an approver for this budget' });
  approver.status = 'rejected';
  approver.comment = req.body.reason || req.body.comment;
  approver.respondedAt = new Date();
  budget.approval.status = 'rejected';
  budget.approval.rejectedAt = new Date();
  budget.approval.rejectedBy = req.user._id;
  budget.approval.rejectionReason = req.body.reason || req.body.comment;
  budget.status = 'rejected';
  budget.isLocked = false;
  await budget.save();
  await notificationService.notify({
    workspace: workspaceId(req),
    sender: req.user._id,
    recipients: [budget.createdBy].filter(Boolean),
    type: 'budget_rejected',
    title: `Budget Rejected: ${budget.budgetNumber}`,
    message: budget.approval.rejectionReason || `${budget.title} has been rejected.`,
    refModel: 'Budget',
    refId: budget._id,
    actionUrl: `/budget/${budget._id}`,
    channels: { inApp: true, email: true },
  });
  res.json({ success: true, message: 'Budget rejected', budget, data: budget });
});

const close = asyncHandler(async (req, res) => {
  const budget = await getBudgetOr404(req, res);
  if (!budget) return;
  budget.status = 'closed';
  budget.closingDate = new Date();
  await budget.save();
  res.json({ success: true, budget, data: budget });
});

const archive = asyncHandler(async (req, res) => {
  const budget = await getBudgetOr404(req, res);
  if (!budget) return;
  budget.status = 'archived';
  await budget.save();
  res.json({ success: true, budget, data: budget });
});

const restore = asyncHandler(async (req, res) => {
  const budget = await Budget.findOne({ _id: budgetId(req), workspace: workspaceId(req), isDeleted: true });
  if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
  budget.isDeleted = false;
  budget.deletedAt = undefined;
  budget.deletedBy = undefined;
  budget.status = budget.status === 'archived' ? 'active' : budget.status;
  await budget.save();
  res.json({ success: true, budget, data: budget });
});

const createRevision = asyncHandler(async (req, res) => {
  const budget = await getBudgetOr404(req, res);
  if (!budget) return;
  if (!req.body.reason) return res.status(400).json({ success: false, message: 'Revision reason is required' });
  const newAmount = Number(req.body.newAmount);
  const oldAmount = Number(budget.totalAmount || 0);
  const revision = await BudgetRevision.create({
    workspace: workspaceId(req),
    budget: budget._id,
    oldAmount,
    newAmount,
    differenceAmount: newAmount - oldAmount,
    revisionType: req.body.revisionType || (newAmount >= oldAmount ? 'increase' : 'decrease'),
    reason: req.body.reason,
    requestedBy: req.user._id,
  });
  res.status(201).json({ success: true, revision, data: revision });
});

const listRevisions = asyncHandler(async (req, res) => {
  const revisions = await BudgetRevision.find({ workspace: workspaceId(req), budget: budgetId(req) }).sort({ createdAt: -1 });
  res.json({ success: true, revisions, data: revisions });
});

const approveRevision = asyncHandler(async (req, res) => {
  const revision = await BudgetRevision.findOne({ _id: req.params.revisionId, workspace: workspaceId(req), budget: budgetId(req) });
  if (!revision) return res.status(404).json({ success: false, message: 'Revision not found' });
  const budget = await Budget.findById(revision.budget);
  revision.approvalStatus = 'approved';
  revision.approvedBy = req.user._id;
  revision.approvedAt = new Date();
  budget.totalAmount = revision.newAmount;
  await revision.save();
  await budget.save();
  await budgetUtilizationService.recalculateBudget(budget._id);
  res.json({ success: true, revision, data: revision });
});

const rejectRevision = asyncHandler(async (req, res) => {
  const revision = await BudgetRevision.findOne({ _id: req.params.revisionId, workspace: workspaceId(req), budget: budgetId(req) });
  if (!revision) return res.status(404).json({ success: false, message: 'Revision not found' });
  revision.approvalStatus = 'rejected';
  revision.rejectedBy = req.user._id;
  revision.rejectedAt = new Date();
  revision.rejectionReason = req.body.reason;
  await revision.save();
  res.json({ success: true, revision, data: revision });
});

const listExpenses = asyncHandler(async (req, res) => {
  const expenses = await Expense.find({ workspace: workspaceId(req), budget: budgetId(req), isDeleted: { $ne: true } }).sort({ expenseDate: -1 });
  res.json({ success: true, expenses, data: expenses });
});

const listPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ workspace: workspaceId(req), budget: budgetId(req) }).sort({ paymentDate: -1 });
  res.json({ success: true, payments, data: payments });
});

const activity = asyncHandler(async (req, res) => {
  res.json({ success: true, activities: [], data: [] });
});

const report = asyncHandler(async (req, res) => {
  const budget = await Budget.findOne({ _id: budgetId(req), workspace: workspaceId(req) }).lean();
  const expenses = await Expense.find({ workspace: workspaceId(req), budget: budgetId(req), isDeleted: { $ne: true } }).lean();
  res.json({ success: true, data: { budget, expenses } });
});

const dashboard = asyncHandler(async (req, res) => {
  const data = await budgetReportService.getDashboard(workspaceId(req));
  res.json({ success: true, data });
});

const reports = asyncHandler(async (req, res) => {
  const budgets = await Budget.find(buildBudgetQuery(req)).lean();
  res.json({ success: true, data: budgets });
});

const exportReports = asyncHandler(async (req, res) => {
  const budgets = await Budget.find(buildBudgetQuery(req)).lean();
  res.json({ success: true, format: req.params.format, data: budgets });
});

const recalculate = asyncHandler(async (req, res) => {
  const budget = await budgetUtilizationService.recalculateBudget(budgetId(req));
  if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
  await budgetAlertService.checkBudgetThresholds(budget._id);
  res.json({ success: true, budget, data: budget });
});

module.exports = {
  getAll,
  create,
  getById,
  update,
  remove,
  submitApproval,
  approve,
  reject,
  close,
  archive,
  restore,
  createRevision,
  listRevisions,
  approveRevision,
  rejectRevision,
  listExpenses,
  listPayments,
  activity,
  report,
  dashboard,
  reports,
  exportReports,
  recalculate,
};
