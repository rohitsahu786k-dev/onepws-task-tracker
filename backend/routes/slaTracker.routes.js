const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled, checkPermission } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/sla.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('sla'));

router.get('/', checkPermission('sla', 'view'), ctrl.getAll);
router.post('/', checkPermission('sla', 'configure'), ctrl.create);
router.get('/:trackerId', checkPermission('sla', 'view'), ctrl.getById);
router.put('/:trackerId', checkPermission('sla', 'configure'), ctrl.update);
router.delete('/:trackerId', checkPermission('sla', 'configure'), ctrl.remove);
router.patch('/:trackerId/phases/:phaseKey/start', checkPermission('sla', 'view'), ctrl.startPhase);
router.patch('/:trackerId/phases/:phaseKey/complete', checkPermission('sla', 'view'), ctrl.completePhase);
router.patch('/:trackerId/phases/:phaseKey/skip', checkPermission('sla', 'configure'), ctrl.skipPhase);
router.post('/:trackerId/request-feedback', checkPermission('sla', 'view'), ctrl.requestFeedback);
router.post('/:trackerId/submit-feedback', checkPermission('sla', 'view'), ctrl.submitFeedback);
router.post('/:trackerId/reset-t0', checkPermission('sla', 'reset_t0'), ctrl.resetT0);
router.get('/:trackerId/timeline', checkPermission('sla', 'view'), ctrl.timeline);
router.get('/:trackerId/escalations', checkPermission('sla', 'view'), ctrl.listTrackerEscalations);
router.get('/:trackerId/reset-history', checkPermission('sla', 'view'), ctrl.listResetHistory);

module.exports = router;
