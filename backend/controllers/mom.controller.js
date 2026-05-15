const asyncHandler = require('../utils/asyncHandler');
const MOM = require('../models/MOM');
const { syncMOMEvent } = require('../services/calendar.service');

const getAll = asyncHandler(async (req, res) => {
  const moms = await MOM.find({ workspace: req.workspace._id }).sort({ meetingDate: -1 });
  res.json({ success: true, moms, data: moms });
});

const create = asyncHandler(async (req, res) => {
  const workspaceId = req.params.wid || req.body.workspace;
  const count = await MOM.countDocuments({ workspace: workspaceId });
  const mom = await MOM.create({
    ...req.body,
    workspace: workspaceId,
    momNumber: req.body.momNumber || `MOM-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`,
    createdBy: req.user._id,
  });

  await syncMOMEvent(mom);
  res.status(201).json({ success: true, mom, data: mom });
});

const getById = asyncHandler(async (req, res) => {
  const mom = await MOM.findOne({ _id: req.params.id, workspace: req.workspace._id });
  if (!mom) return res.status(404).json({ success: false, message: 'MOM not found' });
  res.json({ success: true, mom, data: mom });
});

const update = asyncHandler(async (req, res) => {
  const mom = await MOM.findOneAndUpdate(
    { _id: req.params.id, workspace: req.workspace._id },
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!mom) return res.status(404).json({ success: false, message: 'MOM not found' });

  await syncMOMEvent(mom);
  res.json({ success: true, mom, data: mom });
});

const remove = asyncHandler(async (req, res) => {
  const mom = await MOM.findOne({ _id: req.params.id, workspace: req.workspace._id });
  if (!mom) return res.status(404).json({ success: false, message: 'MOM not found' });

  const CalendarEvent = require('../models/CalendarEvent');
  await CalendarEvent.findOneAndUpdate(
    { workspace: mom.workspace, refModel: 'MOM', refId: mom._id, eventType: 'mom' },
    { status: 'cancelled', 'metadata.cancelledReason': 'MOM deleted' }
  );
  await mom.deleteOne();
  res.json({ success: true, message: 'MOM deleted' });
});

module.exports = {
  getAll,
  create,
  getById,
  update,
  remove,
};
