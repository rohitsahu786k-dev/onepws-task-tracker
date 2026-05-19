const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/timesheet.controller');

router.use(protect, verifyWorkspaceAccess);

router.get('/active', ctrl.activeTimer);
router.post('/stop-current', ctrl.stopCurrentTimer);
router.post('/start', ctrl.startTimer);
router.post('/pause', ctrl.pauseTimer);
router.post('/resume', ctrl.resumeTimer);
router.post('/stop', ctrl.stopTimer);
router.post('/tasks/:taskId/start', ctrl.startTimer);
router.post('/tasks/:taskId/pause', ctrl.pauseTimer);
router.post('/tasks/:taskId/resume', ctrl.resumeTimer);
router.post('/tasks/:taskId/stop', ctrl.stopTimer);

module.exports = router;
