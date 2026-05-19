const asyncHandler = require('../utils/asyncHandler');
const PrintJob = require('../models/PrintJob');
const PrintJobQuotation = require('../models/PrintJobQuotation');
const PrintProof = require('../models/PrintProof');
const PrintDispatch = require('../models/PrintDispatch');
const PrintQualityCheck = require('../models/PrintQualityCheck');
const printJobService = require('../services/printJob.service');
const printActivityService = require('../services/printActivity.service');
const printReportService = require('../services/printReport.service');

const workspaceId = (req) => req.workspace._id;
const printJobId = (req) => req.params.printJobId || req.params.id;

function buildQuery(req) {
  const query = { workspace: workspaceId(req), isDeleted: { $ne: true } };
  if (req.query.status) query.status = req.query.status;
  if (req.query.printJobType) query.printJobType = req.query.printJobType;
  if (req.query.vendor) query.vendor = req.query.vendor;
  if (req.query.project) query.project = req.query.project;
  if (req.query.campaign) query.campaign = req.query.campaign;
  if (req.query.owner) query.owner = req.query.owner;
  if (req.query.designer) query.designer = req.query.designer;
  if (req.query.printCoordinator) query.printCoordinator = req.query.printCoordinator;
  if (req.query.priority) query.priority = req.query.priority;
  if (req.query.search) {
    const search = new RegExp(req.query.search, 'i');
    query.$or = [{ printJobNumber: search }, { title: search }, { vendorName: search }, { tags: search }];
  }
  return query;
}

async function getPrintJobOr404(req, res) {
  const printJob = await PrintJob.findOne({ _id: printJobId(req), workspace: workspaceId(req), isDeleted: { $ne: true } });
  if (!printJob) {
    res.status(404).json({ success: false, message: 'Print job not found' });
    return null;
  }
  return printJob;
}

const getAll = asyncHandler(async (req, res) => {
  const jobs = await PrintJob.find(buildQuery(req)).populate('project campaign task vendor owner designer printCoordinator').sort({ requiredDate: 1, createdAt: -1 });
  res.json({ success: true, data: jobs, printJobs: jobs });
});

const create = asyncHandler(async (req, res) => {
  if (new Date(req.body.requiredDate) < new Date(new Date().toDateString())) {
    return res.status(400).json({ success: false, message: 'Required date cannot be before today' });
  }
  const printJob = await printJobService.createPrintJob({ ...req.body, workspace: workspaceId(req), department: req.body.department || req.workspaceDepartment }, req.user);
  await printActivityService.log({ workspace: workspaceId(req), printJob: printJob._id, action: 'print_job_created', message: `Print job ${printJob.printJobNumber} created`, performedBy: req.user._id });
  res.status(201).json({ success: true, message: 'Print job created successfully', data: printJob, printJob });
});

const getById = asyncHandler(async (req, res) => {
  const printJob = await PrintJob.findOne({ _id: printJobId(req), workspace: workspaceId(req), isDeleted: { $ne: true } }).populate('project campaign task contentItem vendor owner designer approver printCoordinator');
  if (!printJob) return res.status(404).json({ success: false, message: 'Print job not found' });
  const [quotations, proofs, dispatches, qualityChecks] = await Promise.all([
    PrintJobQuotation.find({ workspace: workspaceId(req), printJob: printJob._id }).sort({ totalAmount: 1 }),
    PrintProof.find({ workspace: workspaceId(req), printJob: printJob._id }).sort({ version: -1 }),
    PrintDispatch.find({ workspace: workspaceId(req), printJob: printJob._id }).sort({ dispatchDate: -1 }),
    PrintQualityCheck.find({ workspace: workspaceId(req), printJob: printJob._id }).sort({ createdAt: -1 })
  ]);
  res.json({ success: true, data: { ...printJob.toObject(), quotations, proofs, dispatches, qualityChecks }, printJob: { ...printJob.toObject(), quotations, proofs, dispatches, qualityChecks } });
});

const update = asyncHandler(async (req, res) => {
  const printJob = await getPrintJobOr404(req, res);
  if (!printJob) return;
  if (printJob.status === 'completed' && !['admin', 'owner', 'super_admin'].includes(req.workspaceRole)) {
    return res.status(423).json({ success: false, message: 'Completed print jobs are locked' });
  }
  Object.assign(printJob, req.body, { updatedBy: req.user._id });
  await printJob.save();
  await printActivityService.log({ workspace: workspaceId(req), printJob: printJob._id, action: 'print_job_updated', message: 'Print job updated', performedBy: req.user._id });
  res.json({ success: true, data: printJob, printJob });
});

const remove = asyncHandler(async (req, res) => {
  const printJob = await getPrintJobOr404(req, res);
  if (!printJob) return;
  printJob.isDeleted = true;
  printJob.deletedAt = new Date();
  printJob.deletedBy = req.user._id;
  await printJob.save();
  res.json({ success: true, message: 'Print job deleted' });
});

const updateStatus = asyncHandler(async (req, res) => {
  const printJob = await getPrintJobOr404(req, res);
  if (!printJob) return;
  const oldStatus = printJob.status;
  printJob.status = req.body.status;
  if (req.body.note) printJob.notes = req.body.note;
  await printJob.save();
  await printActivityService.log({ workspace: workspaceId(req), printJob: printJob._id, action: 'print_job_updated', message: `Print job status changed to ${printJob.status}`, oldValue: oldStatus, newValue: printJob.status, performedBy: req.user._id });
  res.json({ success: true, data: printJob, printJob });
});

const uploadArtwork = asyncHandler(async (req, res) => {
  const printJob = await getPrintJobOr404(req, res);
  if (!printJob) return;
  const fileType = req.body.fileType || 'finalPrintFile';
  printJob.artwork = printJob.artwork || {};
  printJob.artwork[fileType] = {
    mediaFile: req.body.mediaFile || req.file?.mediaFile || req.file?._id,
    fileName: req.body.fileName || req.file?.originalname
  };
  printJob.artwork.artworkStatus = fileType === 'finalPrintFile' ? 'final_file_uploaded' : 'in_design';
  printJob.artwork.artworkVersion = Number(printJob.artwork.artworkVersion || 1) + 1;
  printJob.status = fileType === 'finalPrintFile' ? 'artwork_review' : printJob.status;
  await printJob.save();
  await printActivityService.log({ workspace: workspaceId(req), printJob: printJob._id, action: 'artwork_uploaded', message: 'Artwork uploaded', performedBy: req.user._id });
  res.json({ success: true, data: printJob, printJob });
});

const submitArtworkApproval = asyncHandler(async (req, res) => {
  const printJob = await getPrintJobOr404(req, res);
  if (!printJob) return;
  if (!printJob.artwork?.finalPrintFile?.mediaFile) return res.status(400).json({ success: false, message: 'Final print file is required before artwork approval' });
  printJob.status = 'artwork_review';
  printJob.artwork.artworkStatus = 'ready_for_review';
  printJob.approval.status = 'artwork_pending';
  await printJob.save();
  await printActivityService.log({ workspace: workspaceId(req), printJob: printJob._id, action: 'artwork_submitted_for_approval', message: 'Artwork submitted for approval', performedBy: req.user._id });
  res.json({ success: true, message: 'Artwork submitted for approval', data: printJob, printJob });
});

const submitPrintApproval = asyncHandler(async (req, res) => {
  const printJob = await getPrintJobOr404(req, res);
  if (!printJob) return;
  if (!printJob.quotation?.selectedQuotation) return res.status(400).json({ success: false, message: 'Selected quotation is required' });
  printJob.status = 'print_approval_pending';
  printJob.approval.status = 'print_pending';
  await printJob.save();
  res.json({ success: true, message: 'Print approval submitted', data: printJob, printJob });
});

const sendToVendor = asyncHandler(async (req, res) => {
  const printJob = await getPrintJobOr404(req, res);
  if (!printJob) return;
  if (!printJob.artwork?.finalPrintFile?.mediaFile || !printJob.vendor || !printJob.quotation?.selectedQuotation) {
    return res.status(400).json({ success: false, message: 'Approved artwork, selected vendor and quotation are required' });
  }
  printJob.status = 'sent_to_vendor';
  await printJob.save();
  await printActivityService.log({ workspace: workspaceId(req), printJob: printJob._id, action: 'sent_to_vendor', message: 'Print job sent to vendor', performedBy: req.user._id });
  res.json({ success: true, data: printJob, printJob });
});

const productionStatus = asyncHandler(async (req, res) => {
  const printJob = await getPrintJobOr404(req, res);
  if (!printJob) return;
  printJob.status = req.body.status || 'in_production';
  printJob.production = { ...(printJob.production?.toObject?.() || printJob.production || {}), vendorUpdateNotes: req.body.note };
  if (printJob.status === 'in_production' && !printJob.production.startedAt) printJob.production.startedAt = new Date();
  if (printJob.status === 'ready_for_dispatch') printJob.production.readyForDispatchAt = new Date();
  await printJob.save();
  res.json({ success: true, data: printJob, printJob });
});

const complete = asyncHandler(async (req, res) => {
  const printJob = await getPrintJobOr404(req, res);
  if (!printJob) return;
  if (printJob.status !== 'delivered' && req.body.force !== true) return res.status(400).json({ success: false, message: 'Delivered status is required before completion' });
  printJob.status = 'completed';
  await printJob.save();
  res.json({ success: true, data: printJob, printJob });
});

const createReprint = asyncHandler(async (req, res) => {
  const original = await getPrintJobOr404(req, res);
  if (!original) return;
  const reprint = await printJobService.createPrintJob({
    ...original.toObject(),
    _id: undefined,
    printJobNumber: undefined,
    quantity: req.body.quantity || original.quantity,
    workspace: workspaceId(req),
    isReprint: true,
    originalPrintJob: original._id,
    reprintReason: req.body.reason,
    status: 'draft'
  }, req.user);
  original.status = 'reprint_required';
  await original.save();
  res.status(201).json({ success: true, data: reprint, printJob: reprint });
});

const dashboard = asyncHandler(async (req, res) => {
  const data = await printReportService.getDashboard(workspaceId(req));
  res.json({ success: true, data });
});

const reports = asyncHandler(async (req, res) => {
  const printJobs = await PrintJob.find(buildQuery(req)).lean();
  res.json({ success: true, data: printJobs });
});

module.exports = { getAll, create, getById, update, remove, updateStatus, uploadArtwork, submitArtworkApproval, submitPrintApproval, sendToVendor, productionStatus, complete, createReprint, dashboard, reports };
