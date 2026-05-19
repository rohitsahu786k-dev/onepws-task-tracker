const asyncHandler = require('../utils/asyncHandler');
const DashboardWidget = require('../models/DashboardWidget');
const DashboardPreference = require('../models/DashboardPreference');
const dashboardService = require('../services/dashboard.service');
const dashboardWidgetService = require('../services/dashboardWidget.service');

const getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getLayout(req);
  res.json({ success: true, data });
});

const getLayout = getDashboard;

const updateLayout = asyncHandler(async (req, res) => {
  const data = await dashboardService.updateLayout(req);
  res.json({ success: true, data });
});

const resetLayout = asyncHandler(async (req, res) => {
  const DashboardLayout = require('../models/DashboardLayout');
  await DashboardLayout.deleteOne({ workspace: req.workspace._id, user: req.user._id, dashboardType: req.query.type || req.body.dashboardType || 'member' });
  const data = await dashboardService.getLayout(req);
  res.json({ success: true, data });
});

const listWidgets = asyncHandler(async (req, res) => {
  await dashboardWidgetService.ensureDefaultWidgets();
  const widgets = await DashboardWidget.find({ isActive: true }).sort({ order: 1 });
  res.json({ success: true, data: widgets, widgets });
});

const getWidget = asyncHandler(async (req, res) => {
  const widget = await DashboardWidget.findOne({ widgetKey: req.params.widgetKey, isActive: true });
  if (!widget) return res.status(404).json({ success: false, message: 'Widget not found' });
  res.json({ success: true, data: widget, widget });
});

const getWidgetData = asyncHandler(async (req, res) => {
  const data = await dashboardService.getWidgetData(req);
  res.json({ success: true, data });
});

const summary = asyncHandler(async (req, res) => {
  const Task = require('../models/Task');
  const ApprovalRequest = require('../models/ApprovalRequest');
  const CalendarEvent = require('../models/CalendarEvent');
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const [open, overdue, dueToday, pendingMine, eventsToday] = await Promise.all([
    Task.countDocuments({ workspace: req.workspace._id, status: { $nin: ['closed', 'cancelled'] }, isDeleted: { $ne: true } }),
    Task.countDocuments({ workspace: req.workspace._id, dueDate: { $lt: new Date() }, status: { $nin: ['closed', 'cancelled'] }, isDeleted: { $ne: true } }),
    Task.countDocuments({ workspace: req.workspace._id, dueDate: { $gte: start, $lt: end }, status: { $nin: ['closed', 'cancelled'] }, isDeleted: { $ne: true } }),
    ApprovalRequest.countDocuments({ workspace: req.workspace._id, status: { $in: ['pending', 'in_progress'] }, 'steps.approvers.user': req.user._id, isDeleted: { $ne: true } }),
    CalendarEvent.countDocuments({ workspace: req.workspace._id, startDate: { $gte: start, $lt: end } })
  ]);
  res.json({ success: true, data: { tasks: { open, overdue, dueToday }, approvals: { pendingMine }, calendar: { eventsToday } } });
});

const getPreferences = asyncHandler(async (req, res) => {
  const data = await dashboardService.getPreferences(req);
  res.json({ success: true, data });
});

const updatePreferences = asyncHandler(async (req, res) => {
  const data = await DashboardPreference.findOneAndUpdate(
    { workspace: req.workspace._id, user: req.user._id },
    { ...req.body, workspace: req.workspace._id, user: req.user._id },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, data });
});

module.exports = { getDashboard, getLayout, updateLayout, resetLayout, listWidgets, getWidget, getWidgetData, summary, getPreferences, updatePreferences };
