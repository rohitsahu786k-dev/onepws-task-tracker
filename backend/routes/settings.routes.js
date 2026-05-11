const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, requireMinimumRole } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/settings.controller');

router.use(protect, verifyWorkspaceAccess, requireMinimumRole('admin'));

router.post('/email/test', ctrl.testEmail);
router.post('/slack/test', ctrl.testSlack);
router.post('/telegram/test', ctrl.testTelegram);
router.get('/zoom', ctrl.getZoomSettings);
router.put('/zoom', ctrl.updateZoomSettings);
router.post('/zoom/test', ctrl.testZoom);
router.get('/google-meet', ctrl.getGoogleMeetSettings);
router.put('/google-meet', ctrl.updateGoogleMeetSettings);
router.post('/google-meet/test', ctrl.testGoogleMeet);
router.post('/google-meet/disconnect', ctrl.disconnectGoogleMeet);

module.exports = router;
