const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/project.controller');

const access = [protect, verifyWorkspaceAccess, checkModuleEnabled('projects')];

router.get('/', access, ctrl.getAll);
router.post('/', access, ctrl.create);
router.get('/:projectId', access, ctrl.getById);
router.put('/:projectId', access, ctrl.update);
router.delete('/:projectId', access, ctrl.remove);

router.patch('/:projectId/status', access, ctrl.updateStatus);
router.patch('/:projectId/hold', access, ctrl.hold);
router.patch('/:projectId/complete', access, ctrl.complete);
router.patch('/:projectId/cancel', access, ctrl.cancel);
router.patch('/:projectId/archive', access, ctrl.archive);
router.patch('/:projectId/restore', access, ctrl.restore);

router.get('/:projectId/dashboard', access, ctrl.dashboard);
router.get('/:projectId/tasks', access, ctrl.getTasks);
router.post('/:projectId/tasks', access, ctrl.createTask);
router.get('/:projectId/meetings', access, ctrl.getMeetings);
router.get('/:projectId/moms', access, ctrl.getMoms);
router.get('/:projectId/media', access, ctrl.getMedia);
router.get('/:projectId/activity', access, ctrl.activity);
router.get('/:projectId/report', access, ctrl.report);

router.post('/:projectId/members', access, ctrl.addMember);
router.delete('/:projectId/members/:userId', access, ctrl.removeMember);
router.patch('/:projectId/manager', access, ctrl.changeManager);

router.post('/:projectId/link-media', access, ctrl.linkMedia);
router.delete('/:projectId/unlink-media/:mediaId', access, ctrl.unlinkMedia);
router.post('/:projectId/link-budget', access, ctrl.linkBudget);
router.delete('/:projectId/unlink-budget', access, ctrl.unlinkBudget);

module.exports = router;
