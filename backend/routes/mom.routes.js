const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled, checkPermission } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/mom.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('mom'));

router.get('/my-pending-signatures', checkPermission('mom', 'view'), ctrl.myPendingSignatures);
router.get('/pending-action-points', checkPermission('mom', 'view'), ctrl.pendingActionPoints);
router.get('/overdue-action-points', checkPermission('mom', 'view'), ctrl.overdueActionPoints);
router.get('/reports', checkPermission('mom', 'view'), ctrl.reports);
router.post('/reports/export/:format', checkPermission('mom', 'view'), ctrl.exportReports);
router.post('/', checkPermission('mom', 'create'), (req, res, next) => {
  if (req.params.meetingId) return ctrl.createFromMeeting(req, res, next);
  return ctrl.create(req, res, next);
});

router.get('/', checkPermission('mom', 'view'), ctrl.getAll);
router.get('/:momId', checkPermission('mom', 'view'), ctrl.getById);
router.put('/:momId', checkPermission('mom', 'update'), ctrl.update);
router.delete('/:momId', checkPermission('mom', 'delete'), ctrl.remove);

router.patch('/:momId/send-for-signature', checkPermission('mom', 'update'), ctrl.sendForSignature);
router.post('/:momId/sign', checkPermission('mom', 'view'), ctrl.sign);
router.post('/:momId/remind-signatures', checkPermission('mom', 'update'), ctrl.remindSignatures);
router.patch('/:momId/complete', checkPermission('mom', 'update'), ctrl.complete);
router.patch('/:momId/cancel', checkPermission('mom', 'update'), ctrl.cancel);
router.patch('/:momId/archive', checkPermission('mom', 'update'), ctrl.archive);
router.patch('/:momId/restore', checkPermission('mom', 'delete'), ctrl.restore);

router.post('/:momId/generate-pdf', checkPermission('mom', 'view'), ctrl.generatePdf);
router.get('/:momId/download-pdf', checkPermission('mom', 'view'), ctrl.downloadPdf);
router.post('/:momId/email', checkPermission('mom', 'view'), ctrl.emailMOM);

router.post('/:momId/attachments', checkPermission('mom', 'update'), ctrl.addAttachment);
router.delete('/:momId/attachments/:attachmentId', checkPermission('mom', 'update'), ctrl.deleteAttachment);

router.post('/:momId/action-points', checkPermission('mom', 'update'), ctrl.addActionPoint);
router.put('/:momId/action-points/:pointId', checkPermission('mom', 'update'), ctrl.updateActionPoint);
router.delete('/:momId/action-points/:pointId', checkPermission('mom', 'update'), ctrl.deleteActionPoint);
router.patch('/:momId/action-points/:pointId/complete', checkPermission('mom', 'update'), ctrl.completeActionPoint);
router.patch('/:momId/action-points/:pointId/cancel', checkPermission('mom', 'update'), ctrl.cancelActionPoint);
router.post('/:momId/action-points/:pointId/create-task', checkPermission('mom', 'update'), ctrl.createTaskFromPoint);

router.get('/:momId/activity', checkPermission('mom', 'view'), ctrl.activity);

module.exports = router;
