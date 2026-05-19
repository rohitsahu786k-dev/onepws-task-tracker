const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/milestone.controller');

const access = [protect, verifyWorkspaceAccess, checkModuleEnabled('projects')];

router.get('/', access, ctrl.getAll);
router.post('/', access, ctrl.create);
router.get('/:milestoneId', access, ctrl.getById);
router.put('/:milestoneId', access, ctrl.update);
router.delete('/:milestoneId', access, ctrl.remove);
router.patch('/:milestoneId/status', access, ctrl.updateStatus);
router.patch('/:milestoneId/complete', access, ctrl.complete);
router.patch('/:milestoneId/reorder', access, ctrl.reorder);
router.post('/:milestoneId/link-task', access, ctrl.linkTask);
router.delete('/:milestoneId/unlink-task/:taskId', access, ctrl.unlinkTask);

module.exports = router;
