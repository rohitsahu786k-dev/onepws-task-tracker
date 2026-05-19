const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/noteFolder.controller');

router.use(protect);
router.use((req, res, next) => (req.params.wid ? verifyWorkspaceAccess(req, res, next) : next()));

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.patch('/reorder', ctrl.reorder);
router.get('/:folderId', ctrl.getById);
router.put('/:folderId', ctrl.update);
router.delete('/:folderId', ctrl.remove);
router.patch('/:folderId/archive', ctrl.archive);
router.patch('/:folderId/restore', ctrl.restore);
router.patch('/:folderId/move', ctrl.update);
router.get('/:folderId/notes', ctrl.notes);

module.exports = router;
