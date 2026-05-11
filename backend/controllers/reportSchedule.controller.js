const asyncHandler = require('../utils/asyncHandler');
const ReportSchedule = require('../models/ReportSchedule');
const reportScheduleService = require('../services/reportSchedule.service');

// @desc    Get report schedules
// @route   GET /api/workspaces/:wid/report-schedules
const getSchedules = asyncHandler(async (req, res) => {
  const schedules = await ReportSchedule.find({ workspace: req.params.wid })
    .populate('recipients.user', 'name email');
  res.json({ success: true, data: schedules });
});

// @desc    Create report schedule
// @route   POST /api/workspaces/:wid/report-schedules
const createSchedule = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    workspace: req.params.wid,
    createdBy: req.user._id
  };
  if (!payload.nextRunAt) payload.nextRunAt = reportScheduleService.calculateNextRun(payload);
  const schedule = await ReportSchedule.create({
    ...payload
  });
  res.status(201).json({ success: true, data: schedule });
});

// @desc    Update report schedule
// @route   PUT /api/workspaces/:wid/report-schedules/:id
const updateSchedule = asyncHandler(async (req, res) => {
  const update = { ...req.body };
  if (update.frequency || update.scheduleTime || update.dayOfWeek || update.dayOfMonth) {
    update.nextRunAt = reportScheduleService.calculateNextRun({ ...req.body });
  }
  const schedule = await ReportSchedule.findOneAndUpdate(
    { _id: req.params.id, workspace: req.params.wid },
    update,
    { new: true }
  );
  res.json({ success: true, data: schedule });
});

// @desc    Delete report schedule
// @route   DELETE /api/workspaces/:wid/report-schedules/:id
const deleteSchedule = asyncHandler(async (req, res) => {
  await ReportSchedule.findOneAndDelete({ _id: req.params.id, workspace: req.params.wid });
  res.json({ success: true, message: 'Schedule deleted' });
});

// @desc    Toggle schedule active status
// @route   PATCH /api/workspaces/:wid/report-schedules/:id/toggle
const toggleSchedule = asyncHandler(async (req, res) => {
  const schedule = await ReportSchedule.findOne({ _id: req.params.id, workspace: req.params.wid });
  if (!schedule) return res.status(404).json({ success: false, message: 'Not found' });
  
  schedule.isActive = !schedule.isActive;
  await schedule.save();
  res.json({ success: true, data: schedule });
});

module.exports = {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  toggleSchedule
};
