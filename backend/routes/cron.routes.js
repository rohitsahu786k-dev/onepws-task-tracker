const express = require('express');
const router = express.Router();
const { protect, checkGlobalRole } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/cron.controller');

router.use(protect);
router.use(checkGlobalRole(['super_admin', 'admin'])); // Only system admins

router.get('/jobs', ctrl.getJobsStatus);
router.get('/jobs/:jobName/logs', ctrl.getJobLogs);
router.post('/jobs/:jobName/run', ctrl.runJobManually);

module.exports = router;
