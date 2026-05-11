const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/notification.controller');

router.use(protect);

// Global user routes (not workspace specific)
// Mounted at /api/notifications
router.get('/', ctrl.getMyNotifications);
router.get('/unread-count', ctrl.getUnreadCount);
router.get('/:id', ctrl.getNotificationById);
router.patch('/:id/read', ctrl.markAsRead);
router.patch('/read-all', ctrl.markAllAsRead);
router.patch('/:id/archive', ctrl.archiveNotification);
router.delete('/:id', ctrl.deleteNotification);

module.exports = router;
