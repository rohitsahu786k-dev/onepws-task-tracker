const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/apiKey.controller');

router.use(protect);
router.use((req, res, next) => (req.params.wid ? verifyWorkspaceAccess(req, res, next) : next()));

// API Key CRUD
router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.get('/:keyId', ctrl.getById);
router.put('/:keyId', ctrl.update);
router.patch('/:keyId/disable', ctrl.disable);
router.patch('/:keyId/revoke', ctrl.revoke);
router.delete('/:keyId', ctrl.remove);

// Extra
router.get('/:keyId/usage', ctrl.getUsage);
router.post('/:keyId/duplicate', ctrl.duplicate);

module.exports = router;
