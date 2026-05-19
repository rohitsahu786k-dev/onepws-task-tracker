const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/wikiCategory.controller');

router.use(protect, verifyWorkspaceAccess);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.patch('/reorder', ctrl.reorder);
router.get('/:categoryId', ctrl.getById);
router.put('/:categoryId', ctrl.update);
router.delete('/:categoryId', ctrl.remove);
router.patch('/:categoryId/archive', ctrl.archive);
router.patch('/:categoryId/restore', ctrl.restore);
router.patch('/:categoryId/move', ctrl.move);
router.get('/:categoryId/articles', ctrl.articles);

module.exports = router;
