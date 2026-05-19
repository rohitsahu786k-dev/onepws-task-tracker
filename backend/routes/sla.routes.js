const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled, checkPermission } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/sla.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('sla'));

router.get('/dashboard', checkPermission('sla', 'view'), ctrl.dashboard);
router.get('/reports', checkPermission('sla', 'view'), ctrl.reports);
router.post('/reports/export/:format', checkPermission('sla', 'view'), ctrl.exportReport);

router.get('/configs', checkPermission('sla', 'view'), ctrl.configList);
router.post('/configs', checkPermission('sla', 'configure'), ctrl.configCreate);
router.get('/configs/:configId', checkPermission('sla', 'view'), ctrl.configGet);
router.put('/configs/:configId', checkPermission('sla', 'configure'), ctrl.configUpdate);
router.delete('/configs/:configId', checkPermission('sla', 'configure'), ctrl.configRemove);
router.patch('/configs/:configId/activate', checkPermission('sla', 'configure'), ctrl.configActivate);
router.patch('/configs/:configId/deactivate', checkPermission('sla', 'configure'), ctrl.configDeactivate);
router.patch('/configs/:configId/set-default', checkPermission('sla', 'configure'), ctrl.configSetDefault);
router.post('/configs/:configId/clone', checkPermission('sla', 'configure'), ctrl.configClone);

router.get('/escalations', checkPermission('sla', 'view'), ctrl.listEscalations);
router.get('/escalations/:escalationId', checkPermission('sla', 'view'), ctrl.getEscalation);
router.patch('/escalations/:escalationId/acknowledge', checkPermission('sla', 'view'), ctrl.acknowledgeEscalation);
router.patch('/escalations/:escalationId/resolve', checkPermission('sla', 'escalate'), ctrl.resolveEscalation);
router.patch('/escalations/:escalationId/ignore', checkPermission('sla', 'escalate'), ctrl.ignoreEscalation);

router.post('/confirm-t0', checkPermission('sla', 'configure'), ctrl.confirmT0);
router.post('/tasks/:taskId/confirm-t0', checkPermission('sla', 'configure'), ctrl.confirmT0);

router.get('/trackers', checkPermission('sla', 'view'), ctrl.getAll);
router.post('/trackers', checkPermission('sla', 'configure'), ctrl.create);
router.get('/trackers/:trackerId', checkPermission('sla', 'view'), ctrl.getById);
router.put('/trackers/:trackerId', checkPermission('sla', 'configure'), ctrl.update);
router.delete('/trackers/:trackerId', checkPermission('sla', 'configure'), ctrl.remove);
router.patch('/trackers/:trackerId/phases/:phaseKey/start', checkPermission('sla', 'view'), ctrl.startPhase);
router.patch('/trackers/:trackerId/phases/:phaseKey/complete', checkPermission('sla', 'view'), ctrl.completePhase);
router.patch('/trackers/:trackerId/phases/:phaseKey/skip', checkPermission('sla', 'configure'), ctrl.skipPhase);
router.post('/trackers/:trackerId/request-feedback', checkPermission('sla', 'view'), ctrl.requestFeedback);
router.post('/trackers/:trackerId/submit-feedback', checkPermission('sla', 'view'), ctrl.submitFeedback);
router.post('/trackers/:trackerId/reset-t0', checkPermission('sla', 'reset_t0'), ctrl.resetT0);
router.get('/trackers/:trackerId/timeline', checkPermission('sla', 'view'), ctrl.timeline);
router.get('/trackers/:trackerId/escalations', checkPermission('sla', 'view'), ctrl.listTrackerEscalations);
router.get('/trackers/:trackerId/reset-history', checkPermission('sla', 'view'), ctrl.listResetHistory);

// Backwards compatible tracker endpoints under /sla.
router.get('/', checkPermission('sla', 'view'), ctrl.getAll);
router.post('/', checkPermission('sla', 'configure'), ctrl.create);
router.get('/:id', checkPermission('sla', 'view'), ctrl.getById);
router.put('/:id', checkPermission('sla', 'configure'), ctrl.update);
router.patch('/:id/reset-t0', checkPermission('sla', 'reset_t0'), ctrl.resetT0);
router.delete('/:id', checkPermission('sla', 'configure'), ctrl.remove);

module.exports = router;
