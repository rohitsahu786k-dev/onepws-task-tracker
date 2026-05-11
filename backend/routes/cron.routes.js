const express = require('express');
const router = express.Router();
const { protect, checkGlobalRole } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/cron.controller');

router.use(protect);
router.use(checkGlobalRole(['super_admin', 'admin'])); // Only system admins

// Status and Logs
router.get('/jobs', ctrl.getJobsStatus);
router.get('/jobs/:jobName/logs', ctrl.getJobLogs);
router.get('/logs', ctrl.getCronLogs);
router.get('/dashboard', ctrl.getDashboardSummary);

// Job Control
router.post('/jobs/:jobName/run', ctrl.runJobManually);
router.post('/logs/clear', ctrl.clearOldLogs);

// Settings
router.get('/settings', ctrl.getCronSettings);
router.put('/settings', ctrl.updateCronSettings);

module.exports = router;
