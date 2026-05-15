const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  protect,
  verifyWorkspaceAccess,
  checkModuleEnabled,
  checkPermission
} = require('../middleware/auth.middleware');
const ctrl = require('../controllers/mom.controller');

router.use(protect, verifyWorkspaceAccess);
router.use(checkModuleEnabled('mom'));

router.get(
  '/',
  checkPermission('mom', 'view'),
  ctrl.getAll
);
router.post(
  '/',
  checkPermission('mom', 'create'),
  ctrl.create
);
router.get(
  '/:id',
  checkPermission('mom', 'view'),
  ctrl.getById
);
router.put(
  '/:id',
  checkPermission('mom', 'update'),
  ctrl.update
);
router.delete(
  '/:id',
  checkPermission('mom', 'delete'),
  ctrl.remove
);

module.exports = router;
