const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/designation.controller');

router.use(protect, verifyWorkspaceAccess);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:designationId', ctrl.getById);
router.put('/:designationId', ctrl.update);
router.delete('/:designationId', ctrl.remove);
router.patch('/:designationId/activate', ctrl.activate);
router.patch('/:designationId/deactivate', ctrl.deactivate);

module.exports = router;
