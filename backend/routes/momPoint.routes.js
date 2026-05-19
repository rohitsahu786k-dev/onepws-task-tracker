const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled, checkPermission } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/mom.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('mom'));

router.post('/:momId/action-points', checkPermission('mom', 'update'), ctrl.addActionPoint);
router.put('/:momId/action-points/:pointId', checkPermission('mom', 'update'), ctrl.updateActionPoint);
router.delete('/:momId/action-points/:pointId', checkPermission('mom', 'update'), ctrl.deleteActionPoint);
router.patch('/:momId/action-points/:pointId/complete', checkPermission('mom', 'update'), ctrl.completeActionPoint);
router.patch('/:momId/action-points/:pointId/cancel', checkPermission('mom', 'update'), ctrl.cancelActionPoint);
router.post('/:momId/action-points/:pointId/create-task', checkPermission('mom', 'update'), ctrl.createTaskFromPoint);

module.exports = router;
