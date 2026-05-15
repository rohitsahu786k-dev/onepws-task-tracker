const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  protect,
  verifyWorkspaceAccess,
  checkModuleEnabled,
  checkPermission
} = require('../middleware/auth.middleware');
const ctrl = require('../controllers/sla.controller');

router.use(protect);
router.use(verifyWorkspaceAccess);
router.use(checkModuleEnabled('sla'));

router.get('/', checkPermission('sla', 'view'), ctrl.getAll);
router.post('/', checkPermission('sla', 'configure'), ctrl.create);

router.get('/:id', checkPermission('sla', 'view'), ctrl.getById);
router.put('/:id', checkPermission('sla', 'configure'), ctrl.update);
router.patch('/:id/reset-t0', checkPermission('sla', 'reset_t0'), ctrl.resetT0);

// controller exposes remove; map to the closest admin action used in this codebase
router.delete('/:id', checkPermission('sla', 'configure'), ctrl.remove);

module.exports = router;
