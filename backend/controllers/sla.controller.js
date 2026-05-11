const asyncHandler = require('../utils/asyncHandler');
const SLATracker = require('../models/SLATracker');
const Task = require('../models/Task');
const { syncSLAEvents, cancelSLAEvents } = require('../services/calendar.service');

const getAll = asyncHandler(async (req, res) => {
  const query = {};
  if (req.params.wid || req.query.workspace) query.workspace = req.params.wid || req.query.workspace;
  const trackers = await SLATracker.find(query).populate('task', 'taskNumber title assignedTo project').sort({ createdAt: -1 });
  res.json({ success: true, trackers, data: trackers });
});

const create = asyncHandler(async (req, res) => {
  const workspaceId = req.params.wid || req.body.workspace;
  const tracker = await SLATracker.create({ ...req.body, workspace: workspaceId });
  const task = tracker.task ? await Task.findById(tracker.task) : null;
  await syncSLAEvents(tracker, task);
  res.status(201).json({ success: true, tracker, data: tracker });
});

const getById = asyncHandler(async (req, res) => {
  const tracker = await SLATracker.findById(req.params.id).populate('task', 'taskNumber title assignedTo project');
  if (!tracker) return res.status(404).json({ success: false, message: 'SLA tracker not found' });
  res.json({ success: true, tracker, data: tracker });
});

const update = asyncHandler(async (req, res) => {
  const tracker = await SLATracker.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!tracker) return res.status(404).json({ success: false, message: 'SLA tracker not found' });
  const task = tracker.task ? await Task.findById(tracker.task) : null;
  await syncSLAEvents(tracker, task);
  res.json({ success: true, tracker, data: tracker });
});

const resetT0 = asyncHandler(async (req, res) => {
  const tracker = await SLATracker.findById(req.params.id);
  if (!tracker) return res.status(404).json({ success: false, message: 'SLA tracker not found' });

  await cancelSLAEvents(tracker._id, req.body.reason || 'T0 reset');
  tracker.t0Date = req.body.t0Date || new Date();
  tracker.isT0Reset = true;
  tracker.t0ResetReason = req.body.reason;
  tracker.t0ResetAt = new Date();
  tracker.t0ResetBy = req.user._id;
  if (Array.isArray(req.body.phases)) tracker.phases = req.body.phases;
  await tracker.save();

  const task = tracker.task ? await Task.findById(tracker.task) : null;
  await syncSLAEvents(tracker, task);
  res.json({ success: true, tracker, data: tracker });
});

const remove = asyncHandler(async (req, res) => {
  const tracker = await SLATracker.findById(req.params.id);
  if (!tracker) return res.status(404).json({ success: false, message: 'SLA tracker not found' });
  await cancelSLAEvents(tracker._id, 'SLA tracker deleted');
  await tracker.deleteOne();
  res.json({ success: true, message: 'SLA tracker deleted' });
});

module.exports = {
  getAll,
  create,
  getById,
  update,
  resetT0,
  remove,
};
