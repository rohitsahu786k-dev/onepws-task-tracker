const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled, checkPermission } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/report.controller');

const pathTypeMap = {
  task: 'task',
  tracker: 'daily_tracker',
  'user-performance': 'user_performance',
  department: 'department',
  project: 'project',
  sla: 'sla',
  delay: 'delay',
  budget: 'budget',
  expense: 'expense',
  'monthly-management': 'monthly_management',
  mom: 'mom',
  meeting: 'meeting',
  calendar: 'calendar',
  timesheet: 'timesheet',
  media: 'media',
  intake: 'intake',
  approval: 'approval'
};

function setReportType(req, _res, next) {
  if (!pathTypeMap[req.params.kind]) return next('route');
  req.params.reportType = pathTypeMap[req.params.kind];
  next();
}

router.use(protect);
router.use(verifyWorkspaceAccess);
router.use(checkModuleEnabled('reports'));
router.use(checkPermission('reports', 'view'));

router.get('/', ctrl.listReports);
router.post('/generate', ctrl.generateReport);

router.post('/export/:format', (req, _res, next) => {
  req.body.format = req.params.format;
  next();
}, ctrl.generateReport);

router.get('/:kind', setReportType, ctrl.generateReport);
router.post('/:kind', setReportType, ctrl.generateReport);

router.get('/:id/download/:format', ctrl.downloadReport);
router.post('/:id/email', checkPermission('reports', 'email'), ctrl.emailReport);
router.get('/:id', ctrl.getReport);
router.delete('/:id', ctrl.deleteReport);

module.exports = router;
