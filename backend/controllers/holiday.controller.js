const asyncHandler = require('../utils/asyncHandler');
const Holiday = require('../models/Holiday');
const { syncHolidayEvent } = require('../services/calendar.service');

const getHolidays = asyncHandler(async (req, res) => {
  const workspaceId = req.params.wid || req.query.workspace;
  const query = workspaceId ? { workspace: workspaceId } : {};
  const holidays = await Holiday.find(query).sort({ date: 1 });
  res.json({ success: true, holidays, data: holidays });
});

const createHoliday = asyncHandler(async (req, res) => {
  const workspaceId = req.params.wid || req.body.workspace;
  const holiday = await Holiday.create({
    ...req.body,
    workspace: workspaceId,
    createdBy: req.user._id,
  });

  await syncHolidayEvent(holiday);
  res.status(201).json({ success: true, holiday, data: holiday });
});

const getHolidayById = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findOne({ _id: req.params.id, workspace: req.params.wid });
  if (!holiday) return res.status(404).json({ success: false, message: 'Holiday not found' });
  res.json({ success: true, holiday, data: holiday });
});

const updateHoliday = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findOneAndUpdate(
    { _id: req.params.id, workspace: req.params.wid },
    { ...req.body },
    { new: true }
  );
  if (!holiday) return res.status(404).json({ success: false, message: 'Holiday not found' });

  await syncHolidayEvent(holiday);
  res.json({ success: true, holiday, data: holiday });
});

const deleteHoliday = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findOneAndDelete({ _id: req.params.id, workspace: req.params.wid });
  if (!holiday) return res.status(404).json({ success: false, message: 'Holiday not found' });

  const CalendarEvent = require('../models/CalendarEvent');
  await CalendarEvent.findOneAndUpdate(
    { workspace: req.params.wid, refModel: 'Holiday', refId: holiday._id, eventType: 'holiday' },
    { status: 'cancelled', 'metadata.cancelledReason': 'Holiday removed' }
  );

  res.json({ success: true, message: 'Holiday deleted' });
});

const activateHoliday = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findOneAndUpdate({ _id: req.params.holidayId || req.params.id, workspace: req.params.wid }, { isActive: true, updatedBy: req.user?._id }, { new: true });
  if (!holiday) return res.status(404).json({ success: false, message: 'Holiday not found' });
  res.json({ success: true, holiday, data: holiday });
});

const deactivateHoliday = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findOneAndUpdate({ _id: req.params.holidayId || req.params.id, workspace: req.params.wid }, { isActive: false, updatedBy: req.user?._id }, { new: true });
  if (!holiday) return res.status(404).json({ success: false, message: 'Holiday not found' });
  res.json({ success: true, holiday, data: holiday });
});

module.exports = {
  getHolidays,
  createHoliday,
  getHolidayById,
  updateHoliday,
  deleteHoliday,
  activateHoliday,
  deactivateHoliday,
};
