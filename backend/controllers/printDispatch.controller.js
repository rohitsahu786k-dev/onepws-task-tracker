const asyncHandler = require('../utils/asyncHandler');
const PrintJob = require('../models/PrintJob');
const PrintDispatch = require('../models/PrintDispatch');
const printNumbers = require('../services/printJobNumber.service');

const workspaceId = (req) => req.workspace._id;

const list = asyncHandler(async (req, res) => {
  const query = { workspace: workspaceId(req) };
  if (req.params.printJobId) query.printJob = req.params.printJobId;
  const dispatches = await PrintDispatch.find(query).populate('printJob').sort({ dispatchDate: -1 });
  res.json({ success: true, data: dispatches, dispatches });
});

const create = asyncHandler(async (req, res) => {
  const dispatch = await PrintDispatch.create({
    ...req.body,
    workspace: workspaceId(req),
    printJob: req.params.printJobId,
    dispatchNumber: req.body.dispatchNumber || await printNumbers.generateDispatchNumber(workspaceId(req)),
    createdBy: req.user._id
  });
  await PrintJob.findOneAndUpdate({ _id: req.params.printJobId, workspace: workspaceId(req) }, { status: 'dispatched', actualDispatchDate: dispatch.dispatchDate });
  res.status(201).json({ success: true, data: dispatch, dispatch });
});

const getById = asyncHandler(async (req, res) => {
  const dispatch = await PrintDispatch.findOne({ _id: req.params.dispatchId, workspace: workspaceId(req) });
  if (!dispatch) return res.status(404).json({ success: false, message: 'Dispatch not found' });
  res.json({ success: true, data: dispatch, dispatch });
});

const update = asyncHandler(async (req, res) => {
  const dispatch = await PrintDispatch.findOneAndUpdate({ _id: req.params.dispatchId, workspace: workspaceId(req) }, req.body, { new: true, runValidators: true });
  if (!dispatch) return res.status(404).json({ success: false, message: 'Dispatch not found' });
  res.json({ success: true, data: dispatch, dispatch });
});

const remove = asyncHandler(async (req, res) => {
  await PrintDispatch.findOneAndDelete({ _id: req.params.dispatchId, workspace: workspaceId(req) });
  res.json({ success: true, message: 'Dispatch deleted' });
});

function setStatus(status) {
  return asyncHandler(async (req, res) => {
    const update = { status, ...req.body };
    if (status === 'delivered') update.actualDeliveryDate = req.body.actualDeliveryDate || new Date();
    const dispatch = await PrintDispatch.findOneAndUpdate({ _id: req.params.dispatchId, workspace: workspaceId(req) }, update, { new: true });
    if (!dispatch) return res.status(404).json({ success: false, message: 'Dispatch not found' });
    if (status === 'delivered') {
      await PrintJob.findOneAndUpdate({ _id: dispatch.printJob, workspace: workspaceId(req) }, { status: 'delivered', actualDeliveryDate: dispatch.actualDeliveryDate });
    } else if (status === 'dispatched') {
      await PrintJob.findOneAndUpdate({ _id: dispatch.printJob, workspace: workspaceId(req) }, { status: 'dispatched', actualDispatchDate: dispatch.dispatchDate });
    }
    res.json({ success: true, data: dispatch, dispatch });
  });
}

module.exports = { list, create, getById, update, remove, dispatched: setStatus('dispatched'), inTransit: setStatus('in_transit'), delivered: setStatus('delivered'), failed: setStatus('delivery_failed'), returned: setStatus('returned') };
