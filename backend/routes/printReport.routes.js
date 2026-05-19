const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/printReport.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('print_jobs'));

router.get('/', ctrl.reports);
router.post('/export/:format', ctrl.exportReports);

module.exports = router;
