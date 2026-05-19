const asyncHandler = require('../utils/asyncHandler');
const PrintJob = require('../models/PrintJob');
const PrintProof = require('../models/PrintProof');
const printNumbers = require('../services/printJobNumber.service');
const printActivityService = require('../services/printActivity.service');

const workspaceId = (req) => req.workspace._id;

const list = asyncHandler(async (req, res) => {
  const proofs = await PrintProof.find({ workspace: workspaceId(req), printJob: req.params.printJobId }).sort({ version: -1 });
  res.json({ success: true, data: proofs, proofs });
});

const create = asyncHandler(async (req, res) => {
  const latest = await PrintProof.findOne({ workspace: workspaceId(req), printJob: req.params.printJobId }).sort({ version: -1 });
  const proof = await PrintProof.create({
    ...req.body,
    workspace: workspaceId(req),
    printJob: req.params.printJobId,
    proofNumber: req.body.proofNumber || await printNumbers.generateProofNumber(workspaceId(req)),
    version: req.body.version || Number(latest?.version || 0) + 1,
    createdBy: req.user._id
  });
  await PrintJob.findOneAndUpdate({ _id: req.params.printJobId, workspace: workspaceId(req) }, { status: 'proof_review' });
  await printActivityService.log({ workspace: workspaceId(req), printJob: req.params.printJobId, action: 'proof_uploaded', message: `Proof ${proof.proofNumber} uploaded`, performedBy: req.user._id });
  res.status(201).json({ success: true, data: proof, proof });
});

const getById = asyncHandler(async (req, res) => {
  const proof = await PrintProof.findOne({ _id: req.params.proofId, workspace: workspaceId(req) });
  if (!proof) return res.status(404).json({ success: false, message: 'Proof not found' });
  res.json({ success: true, data: proof, proof });
});

const update = asyncHandler(async (req, res) => {
  const proof = await PrintProof.findOneAndUpdate({ _id: req.params.proofId, workspace: workspaceId(req) }, req.body, { new: true, runValidators: true });
  if (!proof) return res.status(404).json({ success: false, message: 'Proof not found' });
  res.json({ success: true, data: proof, proof });
});

const remove = asyncHandler(async (req, res) => {
  await PrintProof.findOneAndDelete({ _id: req.params.proofId, workspace: workspaceId(req) });
  res.json({ success: true, message: 'Proof deleted' });
});

const approve = asyncHandler(async (req, res) => {
  const proof = await PrintProof.findOne({ _id: req.params.proofId, workspace: workspaceId(req) });
  if (!proof) return res.status(404).json({ success: false, message: 'Proof not found' });
  proof.reviewStatus = 'approved';
  proof.reviewedBy = req.user._id;
  proof.approvedAt = new Date();
  proof.reviewComments = req.body.comment;
  await proof.save();
  await PrintJob.findOneAndUpdate({ _id: proof.printJob, workspace: workspaceId(req) }, { status: 'proof_approved', 'artwork.proofFile': proof.proofFile });
  await printActivityService.log({ workspace: workspaceId(req), printJob: proof.printJob, action: 'proof_approved', message: `Proof ${proof.proofNumber} approved`, performedBy: req.user._id });
  res.json({ success: true, data: proof, proof });
});

const reject = asyncHandler(async (req, res) => {
  const proof = await PrintProof.findOneAndUpdate({ _id: req.params.proofId, workspace: workspaceId(req) }, { reviewStatus: 'rejected', reviewedBy: req.user._id, rejectedAt: new Date(), rejectionReason: req.body.reason }, { new: true });
  if (!proof) return res.status(404).json({ success: false, message: 'Proof not found' });
  await PrintJob.findOneAndUpdate({ _id: proof.printJob, workspace: workspaceId(req) }, { status: 'proof_review' });
  res.json({ success: true, data: proof, proof });
});

const requestChanges = asyncHandler(async (req, res) => {
  const proof = await PrintProof.findOneAndUpdate({ _id: req.params.proofId, workspace: workspaceId(req) }, { reviewStatus: 'changes_required', reviewedBy: req.user._id, reviewComments: req.body.comment, changesRequired: req.body.changesRequired || [] }, { new: true });
  if (!proof) return res.status(404).json({ success: false, message: 'Proof not found' });
  res.json({ success: true, data: proof, proof });
});

module.exports = { list, create, getById, update, remove, approve, reject, requestChanges };
