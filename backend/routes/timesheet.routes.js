const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/timesheet.controller');

router.use(protect);
router.use((req, res, next) => (req.params.wid ? verifyWorkspaceAccess(req, res, next) : next()));

router.get('/my', ctrl.myTimesheets);
router.get('/current', ctrl.current);
router.get('/approvals/pending', ctrl.pendingApprovals);
router.get('/missing', ctrl.missing);
router.get('/team', ctrl.list);
router.get('/dashboard', ctrl.dashboard);
router.get('/workload', ctrl.workload);
router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSettings);

router.get('/timer/active', ctrl.activeTimer);
router.post('/timer/stop-current', ctrl.stopCurrentTimer);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:timesheetId', ctrl.getById);
router.put('/:timesheetId', ctrl.update);
router.delete('/:timesheetId', ctrl.remove);
router.post('/:timesheetId/submit', ctrl.submit);
router.patch('/:timesheetId/approve', ctrl.approve);
router.patch('/:timesheetId/reject', ctrl.reject);
router.patch('/:timesheetId/reopen', ctrl.reopen);
router.patch('/:timesheetId/lock', ctrl.lock);
router.patch('/:timesheetId/unlock', ctrl.unlock);

module.exports = router;
