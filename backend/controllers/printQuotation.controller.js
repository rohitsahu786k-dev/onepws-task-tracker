const asyncHandler = require('../utils/asyncHandler');
const PrintJob = require('../models/PrintJob');
const PrintJobQuotation = require('../models/PrintJobQuotation');
const Vendor = require('../models/Vendor');
const printNumbers = require('../services/printJobNumber.service');
const printQuotationService = require('../services/printQuotation.service');

const workspaceId = (req) => req.workspace._id;

const list = asyncHandler(async (req, res) => {
  const query = { workspace: workspaceId(req) };
  if (req.params.printJobId) query.printJob = req.params.printJobId;
  const quotations = await PrintJobQuotation.find(query).populate('vendor printJob').sort({ createdAt: -1 });
  res.json({ success: true, data: quotations, quotations });
});

const create = asyncHandler(async (req, res) => {
  const totals = printQuotationService.calculatePrintQuotationTotal(req.body);
  const vendor = await Vendor.findOne({ _id: req.body.vendor, workspace: workspaceId(req), isDeleted: { $ne: true } });
  const quotation = await PrintJobQuotation.create({
    ...req.body,
    ...totals,
    workspace: workspaceId(req),
    printJob: req.params.printJobId,
    quotationNumber: req.body.quotationNumber || await printNumbers.generateQuotationNumber(workspaceId(req)),
    vendorName: req.body.vendorName || vendor?.vendorName || vendor?.name,
    createdBy: req.user._id
  });
  await PrintJob.findOneAndUpdate({ _id: req.params.printJobId, workspace: workspaceId(req) }, { status: 'quotation_pending', 'quotation.estimatedCost': quotation.totalAmount });
  res.status(201).json({ success: true, data: quotation, quotation });
});

const getById = asyncHandler(async (req, res) => {
  const quotation = await PrintJobQuotation.findOne({ _id: req.params.quotationId, workspace: workspaceId(req) }).populate('vendor printJob');
  if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
  res.json({ success: true, data: quotation, quotation });
});

const update = asyncHandler(async (req, res) => {
  const totals = printQuotationService.calculatePrintQuotationTotal(req.body);
  const quotation = await PrintJobQuotation.findOneAndUpdate({ _id: req.params.quotationId, workspace: workspaceId(req) }, { ...req.body, ...totals, updatedBy: req.user._id }, { new: true, runValidators: true });
  if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
  res.json({ success: true, data: quotation, quotation });
});

const remove = asyncHandler(async (req, res) => {
  await PrintJobQuotation.findOneAndDelete({ _id: req.params.quotationId, workspace: workspaceId(req) });
  res.json({ success: true, message: 'Quotation deleted' });
});

const select = asyncHandler(async (req, res) => {
  const quotation = await PrintJobQuotation.findOne({ _id: req.params.quotationId, workspace: workspaceId(req) });
  if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
  const vendor = await Vendor.findOne({ _id: quotation.vendor, workspace: workspaceId(req), status: 'active', isDeleted: { $ne: true } });
  if (!vendor) return res.status(400).json({ success: false, message: 'Only active vendors can be selected' });
  quotation.status = 'selected';
  quotation.selectedAt = new Date();
  quotation.selectedBy = req.user._id;
  await quotation.save();
  await PrintJob.findOneAndUpdate({ _id: quotation.printJob, workspace: workspaceId(req) }, { vendor: quotation.vendor, vendorName: vendor.vendorName || vendor.name, 'quotation.selectedQuotation': quotation._id, 'quotation.approvedCost': quotation.totalAmount, status: 'quotation_selected' });
  await PrintJobQuotation.updateMany({ workspace: workspaceId(req), printJob: quotation.printJob, _id: { $ne: quotation._id }, status: { $in: ['received', 'under_review'] } }, { status: 'rejected', rejectionReason: 'Another quotation selected' });
  res.json({ success: true, data: quotation, quotation });
});

const reject = asyncHandler(async (req, res) => {
  const quotation = await PrintJobQuotation.findOneAndUpdate({ _id: req.params.quotationId, workspace: workspaceId(req) }, { status: 'rejected', rejectionReason: req.body.reason }, { new: true });
  if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
  res.json({ success: true, data: quotation, quotation });
});

const expire = asyncHandler(async (req, res) => {
  const quotation = await PrintJobQuotation.findOneAndUpdate({ _id: req.params.quotationId, workspace: workspaceId(req) }, { status: 'expired' }, { new: true });
  if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
  res.json({ success: true, data: quotation, quotation });
});

module.exports = { list, create, getById, update, remove, select, reject, expire };
