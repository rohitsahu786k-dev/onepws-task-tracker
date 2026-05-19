const dayjs = require('dayjs');
const asyncHandler = require('../utils/asyncHandler');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Payment = require('../models/Payment');
const { syncExpenseEvent } = require('../services/calendar.service');
const notificationService = require('../services/notification.service');
const expenseService = require('../services/expense.service');
const budgetUtilizationService = require('../services/budgetUtilization.service');
const budgetAlertService = require('../services/budgetAlert.service');
const paymentService = require('../services/payment.service');

const workspaceId = (req) => req.workspace?._id || req.params.wid || req.body.workspace || req.query.workspace;
const expenseId = (req) => req.params.expenseId || req.params.id;

function buildExpenseQuery(req, extra = {}) {
  const query = { workspace: workspaceId(req), isDeleted: { $ne: true }, ...extra };
  if (req.query.status) query.status = req.query.status;
  if (req.query.paymentStatus) query.paymentStatus = req.query.paymentStatus;
  if (req.query.budget) query.budget = req.query.budget;
  if (req.query.project) query.project = req.query.project;
  if (req.query.department) query.department = req.query.department;
  if (req.query.expenseCategory) query.expenseCategory = req.query.expenseCategory;
  if (req.query.vendor) query.vendor = req.query.vendor;
  return query;
}

async function getExpenseOr404(req, res) {
  const expense = await Expense.findOne({ _id: expenseId(req), workspace: workspaceId(req), isDeleted: { $ne: true } });
  if (!expense) {
    res.status(404).json({ success: false, message: 'Expense not found' });
    return null;
  }
  return expense;
}

const getAll = asyncHandler(async (req, res) => {
  const expenses = await Expense.find(buildExpenseQuery(req)).populate('budget project department vendor').sort({ expenseDate: -1, createdAt: -1 });
  res.json({ success: true, expenses, data: expenses });
});

const create = asyncHandler(async (req, res) => {
  const expense = await expenseService.createExpense({ ...req.body, workspace: workspaceId(req) }, req.user);
  await budgetUtilizationService.recalculateBudget(expense.budget);
  await syncExpenseEvent(expense);
  res.status(201).json({ success: true, message: 'Expense created successfully', expense, data: expense });
});

const getById = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: expenseId(req), workspace: workspaceId(req), isDeleted: { $ne: true } }).populate('budget project task department vendor requestedBy createdBy');
  if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
  const payments = await Payment.find({ workspace: workspaceId(req), expense: expense._id }).sort({ paymentDate: -1 });
  res.json({ success: true, expense: { ...expense.toObject(), payments }, data: { ...expense.toObject(), payments } });
});

const update = asyncHandler(async (req, res) => {
  const expense = await getExpenseOr404(req, res);
  if (!expense) return;
  if (['approved', 'paid'].includes(expense.status) && !['admin', 'owner', 'super_admin'].includes(req.workspaceRole)) {
    return res.status(423).json({ success: false, message: 'Approved or paid expenses are locked' });
  }
  Object.assign(expense, req.body, { updatedBy: req.user._id });
  await expense.save();
  await budgetUtilizationService.recalculateBudget(expense.budget);
  await syncExpenseEvent(expense);
  res.json({ success: true, expense, data: expense });
});

const remove = asyncHandler(async (req, res) => {
  const expense = await getExpenseOr404(req, res);
  if (!expense) return;
  expense.isDeleted = true;
  expense.deletedAt = new Date();
  expense.deletedBy = req.user._id;
  await expense.save();
  await budgetUtilizationService.recalculateBudget(expense.budget);
  res.json({ success: true, message: 'Expense deleted' });
});

const submitApproval = asyncHandler(async (req, res) => {
  const expense = await getExpenseOr404(req, res);
  if (!expense) return;
  if (!expense.approval?.approvers?.length) return res.status(400).json({ success: false, message: 'At least one approver is required' });
  expense.status = 'pending_approval';
  expense.approval.status = 'pending';
  expense.approval.submittedAt = new Date();
  await expense.save();
  await budgetUtilizationService.recalculateBudget(expense.budget);
  await notificationService.notify({
    workspace: workspaceId(req),
    sender: req.user._id,
    recipients: expense.approval.approvers.map((item) => item.user).filter(Boolean),
    type: 'expense_approval_requested',
    title: `Expense Approval Required: ${expense.expenseNumber}`,
    message: `${expense.title} requires your approval.`,
    refModel: 'Expense',
    refId: expense._id,
    actionUrl: `/expenses/${expense._id}`,
    priority: 'high',
    channels: { inApp: true, email: true },
    metadata: { expenseNumber: expense.expenseNumber, amount: expense.totalAmount },
  });
  res.json({ success: true, message: 'Expense submitted for approval', expense, data: expense });
});

const approve = asyncHandler(async (req, res) => {
  const expense = await getExpenseOr404(req, res);
  if (!expense) return;
  const approver = expense.approval.approvers.find((item) => item.user?.toString() === req.user._id.toString());
  if (!approver) return res.status(403).json({ success: false, message: 'You are not an approver for this expense' });
  approver.status = 'approved';
  approver.comment = req.body.comment;
  approver.respondedAt = new Date();
  if (expense.approval.approvers.every((item) => item.status === 'approved')) {
    expense.approval.status = 'approved';
    expense.approval.approvedAt = new Date();
    expense.approval.approvedBy = req.user._id;
    expense.status = 'approved';
    expense.approvedAt = new Date();
    expense.approvedBy = req.user._id;
  }
  await expense.save();
  await budgetUtilizationService.recalculateBudget(expense.budget);
  await budgetAlertService.checkBudgetThresholds(expense.budget);
  await notificationService.notify({
    workspace: workspaceId(req),
    sender: req.user._id,
    recipients: [expense.createdBy].filter(Boolean),
    type: 'expense_approved',
    title: `Expense Approved: ${expense.expenseNumber}`,
    message: `${expense.title} has been approved.`,
    refModel: 'Expense',
    refId: expense._id,
    actionUrl: `/expenses/${expense._id}`,
    channels: { inApp: true, email: true },
  });
  res.json({ success: true, message: 'Expense approved successfully', expense, data: expense });
});

const reject = asyncHandler(async (req, res) => {
  const expense = await getExpenseOr404(req, res);
  if (!expense) return;
  const approver = expense.approval.approvers.find((item) => item.user?.toString() === req.user._id.toString());
  if (!approver) return res.status(403).json({ success: false, message: 'You are not an approver for this expense' });
  approver.status = 'rejected';
  approver.comment = req.body.reason || req.body.comment;
  approver.respondedAt = new Date();
  expense.approval.status = 'rejected';
  expense.approval.rejectedAt = new Date();
  expense.approval.rejectedBy = req.user._id;
  expense.approval.rejectionReason = req.body.reason || req.body.comment;
  expense.status = 'rejected';
  expense.rejectionReason = expense.approval.rejectionReason;
  await expense.save();
  await budgetUtilizationService.recalculateBudget(expense.budget);
  res.json({ success: true, message: 'Expense rejected', expense, data: expense });
});

const cancel = asyncHandler(async (req, res) => {
  const expense = await getExpenseOr404(req, res);
  if (!expense) return;
  expense.status = 'cancelled';
  expense.paymentStatus = 'cancelled';
  await expense.save();
  await budgetUtilizationService.recalculateBudget(expense.budget);
  res.json({ success: true, expense, data: expense });
});

const archive = asyncHandler(async (req, res) => {
  const expense = await getExpenseOr404(req, res);
  if (!expense) return;
  expense.status = 'archived';
  await expense.save();
  res.json({ success: true, expense, data: expense });
});

const restore = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: expenseId(req), workspace: workspaceId(req), isDeleted: true });
  if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
  expense.isDeleted = false;
  expense.deletedAt = undefined;
  expense.deletedBy = undefined;
  await expense.save();
  await budgetUtilizationService.recalculateBudget(expense.budget);
  res.json({ success: true, expense, data: expense });
});

const addReceipt = asyncHandler(async (req, res) => {
  const expense = await getExpenseOr404(req, res);
  if (!expense) return;
  expense.receiptFiles.push({ ...req.body, uploadedAt: new Date() });
  if (!expense.receiptFile?.fileName) expense.receiptFile = { fileName: req.body.fileName, fileUrl: req.body.fileUrl, filePath: req.body.filePath };
  await expense.save();
  res.status(201).json({ success: true, receipts: expense.receiptFiles, data: expense.receiptFiles });
});

const listReceipts = asyncHandler(async (req, res) => {
  const expense = await getExpenseOr404(req, res);
  if (!expense) return;
  res.json({ success: true, receipts: expense.receiptFiles, data: expense.receiptFiles });
});

const deleteReceipt = asyncHandler(async (req, res) => {
  const expense = await getExpenseOr404(req, res);
  if (!expense) return;
  const receipt = expense.receiptFiles.id(req.params.receiptId);
  if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
  receipt.deleteOne();
  await expense.save();
  res.json({ success: true, receipts: expense.receiptFiles, data: expense.receiptFiles });
});

const recordPayment = asyncHandler(async (req, res) => {
  const expense = await getExpenseOr404(req, res);
  if (!expense) return;
  if (!['approved', 'paid'].includes(expense.status)) return res.status(400).json({ success: false, message: 'Only approved expenses can be paid' });
  const payment = await Payment.create({
    workspace: workspaceId(req),
    paymentNumber: await paymentService.generatePaymentNumber(workspaceId(req)),
    expense: expense._id,
    budget: expense.budget,
    vendor: expense.vendor,
    amount: req.body.amount || expense.totalAmount,
    paymentDate: req.body.paymentDate || new Date(),
    paymentMethod: req.body.paymentMethod,
    paymentReference: req.body.paymentReference,
    status: 'paid',
    paidBy: req.user._id,
    notes: req.body.notes,
  });
  expense.paymentStatus = 'paid';
  expense.status = 'paid';
  expense.paymentDate = payment.paymentDate;
  expense.paymentMethod = payment.paymentMethod;
  expense.paymentReference = payment.paymentReference;
  expense.paidBy = req.user._id;
  await expense.save();
  await syncExpenseEvent(expense);
  res.status(201).json({ success: true, message: 'Payment recorded successfully', payment, data: payment });
});

const listPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ workspace: workspaceId(req), expense: expenseId(req) }).sort({ paymentDate: -1 });
  res.json({ success: true, payments, data: payments });
});

const my = asyncHandler(async (req, res) => {
  const expenses = await Expense.find(buildExpenseQuery(req, { $or: [{ createdBy: req.user._id }, { requestedBy: req.user._id }] })).sort({ createdAt: -1 });
  res.json({ success: true, expenses, data: expenses });
});

const pendingApprovals = asyncHandler(async (req, res) => {
  const expenses = await Expense.find(buildExpenseQuery(req, { status: 'pending_approval', 'approval.approvers.user': req.user._id })).sort({ createdAt: -1 });
  res.json({ success: true, expenses, data: expenses });
});

const paymentDue = asyncHandler(async (req, res) => {
  const end = dayjs().add(1, 'day').endOf('day').toDate();
  const expenses = await Expense.find(buildExpenseQuery(req, { paymentStatus: { $ne: 'paid' }, paymentDueDate: { $lte: end } })).sort({ paymentDueDate: 1 });
  res.json({ success: true, expenses, data: expenses });
});

const overduePayments = asyncHandler(async (req, res) => {
  const expenses = await Expense.find(buildExpenseQuery(req, { paymentStatus: { $ne: 'paid' }, paymentDueDate: { $lt: dayjs().startOf('day').toDate() } })).sort({ paymentDueDate: 1 });
  res.json({ success: true, expenses, data: expenses });
});

const activity = asyncHandler(async (req, res) => {
  res.json({ success: true, activities: [], data: [] });
});

const reports = asyncHandler(async (req, res) => {
  const expenses = await Expense.find(buildExpenseQuery(req)).lean();
  res.json({ success: true, data: expenses });
});

const exportReports = asyncHandler(async (req, res) => {
  const expenses = await Expense.find(buildExpenseQuery(req)).lean();
  res.json({ success: true, format: req.params.format, data: expenses });
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
  cancel,
  archive,
  restore,
  addReceipt,
  listReceipts,
  deleteReceipt,
  recordPayment,
  listPayments,
  my,
  pendingApprovals,
  paymentDue,
  overduePayments,
  activity,
  reports,
  exportReports,
};
