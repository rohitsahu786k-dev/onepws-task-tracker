const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled, checkPermission } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/reportSchedule.controller');

router.use(protect);
router.use(verifyWorkspaceAccess);
router.use(checkModuleEnabled('reports'));
router.use(checkPermission('reports', 'schedule'));

router.get('/', ctrl.getSchedules);
router.post('/', ctrl.createSchedule);
router.put('/:id', ctrl.updateSchedule);
router.delete('/:id', ctrl.deleteSchedule);
router.patch('/:id/toggle', ctrl.toggleSchedule);

module.exports = router;
