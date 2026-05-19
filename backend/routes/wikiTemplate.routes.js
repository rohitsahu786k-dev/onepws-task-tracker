const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/wikiTemplate.controller');

router.use(protect, verifyWorkspaceAccess);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:templateId', ctrl.getById);
router.put('/:templateId', ctrl.update);
router.delete('/:templateId', ctrl.remove);
router.patch('/:templateId/set-default', ctrl.setDefault);
router.post('/:templateId/clone', ctrl.clone);
router.post('/:templateId/create-article', ctrl.createArticle);

module.exports = router;
