const asyncHandler = require('../utils/asyncHandler');
const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');

// @desc    Get user notifications
// @route   GET /api/notifications
const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    recipient: req.user._id,
    isArchived: false
  })
    .sort({ createdAt: -1 })
    .limit(Number(req.query.limit) || 20)
    .skip(Number(req.query.skip) || 0);

  res.json({ success: true, data: notifications });
});

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
    isArchived: false
  });
  res.json({ success: true, count });
});

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
const getNotificationById = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
  if (!notification) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: notification });
});

// @desc    Mark as read
// @route   PATCH /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  res.json({ success: true, data: notification });
});

// @desc    Mark all as read
// @route   PATCH /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  res.json({ success: true, message: "All notifications marked as read" });
});

// @desc    Archive notification
// @route   PATCH /api/notifications/:id/archive
const archiveNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isArchived: true, archivedAt: new Date() },
    { new: true }
  );
  res.json({ success: true, data: notification });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  res.json({ success: true, message: 'Deleted' });
});

// @desc    Get preferences
// @route   GET /api/workspaces/:wid/notification-preferences
const getPreferences = asyncHandler(async (req, res) => {
  const prefs = await NotificationPreference.findOne({ workspace: req.params.wid, user: req.user._id });
  res.json({ success: true, data: prefs || {} });
});

// @desc    Update preferences
// @route   PUT /api/workspaces/:wid/notification-preferences
const updatePreferences = asyncHandler(async (req, res) => {
  const prefs = await NotificationPreference.findOneAndUpdate(
    { workspace: req.params.wid, user: req.user._id },
    { $set: req.body },
    { new: true, upsert: true }
  );
  res.json({ success: true, data: prefs });
});

module.exports = {
  getMyNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  deleteNotification,
  getPreferences,
  updatePreferences
};
