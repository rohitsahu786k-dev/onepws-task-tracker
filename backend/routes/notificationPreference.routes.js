const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/notification.controller');

router.use(protect);

// Workspace specific routes for notification preferences
// Mounted at /api/workspaces/:wid/notification-preferences
router.get('/', ctrl.getPreferences);
router.put('/', ctrl.updatePreferences);

module.exports = router;
