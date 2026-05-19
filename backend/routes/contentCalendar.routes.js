const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/contentCalendar.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('content_calendar'));

router.get('/', ctrl.getAll);
router.get('/month', ctrl.month);
router.get('/week', ctrl.week);
router.get('/list', ctrl.list);
router.get('/platform/:platform', ctrl.platform);
router.get('/campaign/:campaignId', ctrl.campaign);

module.exports = router;
