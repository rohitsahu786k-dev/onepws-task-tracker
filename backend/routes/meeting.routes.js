const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled, checkPermission } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/meeting.controller');

router.use(protect);
router.use(verifyWorkspaceAccess);
router.use(checkModuleEnabled('meetings'));

router.post('/check-conflict', checkPermission('meetings', 'view'), ctrl.checkConflict);

router.route('/')
  .get(checkPermission('meetings', 'view'), ctrl.getMeetings)
  .post(checkPermission('meetings', 'create'), ctrl.createMeeting);

router.route('/:id')
  .get(checkPermission('meetings', 'view'), ctrl.getMeeting)
  .put(checkPermission('meetings', 'update'), ctrl.updateMeeting)
  .delete(checkPermission('meetings', 'delete'), ctrl.deleteMeeting);

router.patch('/:id/cancel', checkPermission('meetings', 'cancel'), ctrl.cancelMeeting);
router.patch('/:id/complete', checkPermission('meetings', 'complete'), ctrl.completeMeeting);
router.patch('/:id/reschedule', checkPermission('meetings', 'update'), ctrl.rescheduleMeeting);
router.patch('/:id/respond', checkPermission('meetings', 'view'), ctrl.respondToMeeting);

router.post('/:id/zoom', checkPermission('meetings', 'create_zoom'), ctrl.addZoomLink);
router.post('/:id/google-meet', checkPermission('meetings', 'create_google_meet'), ctrl.addGoogleMeetLink);
router.post('/:id/send-invite', checkPermission('meetings', 'update'), ctrl.sendInvite);
router.post('/:id/create-mom', checkPermission('meetings', 'create_mom'), ctrl.createMOM);

router.post('/:id/attachments', checkPermission('meetings', 'update'), ctrl.addAttachment);
router.delete('/:id/attachments/:attachmentId', checkPermission('meetings', 'update'), ctrl.removeAttachment);

module.exports = router;
