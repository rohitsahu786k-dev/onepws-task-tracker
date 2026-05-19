const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/note.controller');

router.use(protect);
router.use((req, res, next) => (req.params.wid ? verifyWorkspaceAccess(req, res, next) : next()));

router.get('/my', (req, res, next) => {
  req.query.createdBy = req.user?._id;
  next();
}, ctrl.list);
router.get('/shared-with-me', ctrl.list);
router.get('/pinned', (req, res, next) => {
  req.query.pinned = 'true';
  next();
}, ctrl.list);
router.get('/recent', ctrl.list);
router.get('/archived', (req, res, next) => {
  req.query.archived = 'true';
  next();
}, ctrl.list);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:noteId', ctrl.getById);
router.put('/:noteId', ctrl.update);
router.delete('/:noteId', ctrl.remove);
router.patch('/:noteId/autosave', ctrl.autosave);
router.post('/:noteId/share', ctrl.share);
router.post('/:noteId/unshare', ctrl.unshare);
router.patch('/:noteId/pin', ctrl.pin);
router.patch('/:noteId/unpin', ctrl.unpin);
router.patch('/:noteId/favorite', ctrl.favorite);
router.patch('/:noteId/unfavorite', ctrl.unfavorite);
router.patch('/:noteId/archive', ctrl.archive);
router.patch('/:noteId/restore', ctrl.restore);
router.post('/:noteId/attachments', ctrl.addAttachment);
router.get('/:noteId/attachments', ctrl.getById);
router.delete('/:noteId/attachments/:attachmentId', ctrl.removeAttachment);
router.get('/:noteId/versions', ctrl.versions);
router.post('/:noteId/versions', ctrl.createVersion);
router.post('/:noteId/versions/:versionId/restore', ctrl.restoreVersion);
router.get('/:noteId/activity', ctrl.activity);
router.post('/:noteId/convert-to-task', ctrl.convertToTask);
router.post('/:noteId/convert-to-wiki', ctrl.convertToWiki);

module.exports = router;
