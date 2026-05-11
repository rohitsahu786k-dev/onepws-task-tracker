const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled, checkPermission } = require('../middleware/auth.middleware');
const { checkAnyPermission } = require('../utils/permission');
const { checkTrackerRowAccess, checkTrackerCellFieldAccess } = require('../middleware/ownership.middleware');
const ctrl = require('../controllers/tracker.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('tracker'));

router.get('/config', checkPermission('tracker', 'view'), ctrl.getConfig);
router.post('/config', checkPermission('tracker', 'configure_fields'), ctrl.createConfig);
router.put('/config/:id', checkPermission('tracker', 'configure_fields'), ctrl.updateConfig);
router.post('/config/fields', checkPermission('tracker', 'configure_fields'), ctrl.addConfigField);
router.put('/config/fields/:fieldId', checkPermission('tracker', 'configure_fields'), ctrl.updateConfigField);
router.delete('/config/fields/:fieldId', checkPermission('tracker', 'configure_fields'), ctrl.deleteConfigField);
router.patch('/config/reorder', checkPermission('tracker', 'configure_fields'), ctrl.reorderConfigFields);

router.get('/rows', checkPermission('tracker', 'view'), ctrl.getRows);
router.post('/rows', checkPermission('tracker', 'create_row'), ctrl.createRow);
router.get('/rows/:rowId', checkPermission('tracker', 'view'), ctrl.getRowById);
router.put(
  '/rows/:rowId',
  checkAnyPermission([
    { module: 'tracker', action: 'update_any_row' },
    { module: 'tracker', action: 'update_department_row' },
    { module: 'tracker', action: 'update_own_row' }
  ]),
  checkTrackerRowAccess,
  ctrl.updateRow
);
router.patch(
  '/rows/:rowId/cell',
  checkAnyPermission([
    { module: 'tracker', action: 'update_any_row' },
    { module: 'tracker', action: 'update_department_row' },
    { module: 'tracker', action: 'update_own_row' },
    { module: 'tracker', action: 'update_cell' }
  ]),
  checkTrackerRowAccess,
  checkTrackerCellFieldAccess,
  ctrl.patchCell
);
router.delete('/rows/:rowId', checkPermission('tracker', 'delete_row'), ctrl.deleteRow);
router.patch('/rows/:rowId/submit', checkTrackerRowAccess, ctrl.submitRow);
router.patch('/rows/:rowId/lock', checkPermission('tracker', 'lock_row'), ctrl.lockRow);
router.patch('/rows/:rowId/unlock', checkPermission('tracker', 'unlock_row'), ctrl.unlockRow);

router.post('/import', checkPermission('tracker', 'bulk_import'), (req, res) => res.json({}));
router.get('/import/:importId', checkPermission('tracker', 'bulk_import'), (req, res) => res.json({}));
router.get('/template', checkPermission('tracker', 'bulk_export'), (req, res) => res.json({}));
router.post('/export/excel', checkPermission('tracker', 'bulk_export'), (req, res) => res.json({}));
router.post('/export/pdf', checkPermission('tracker', 'bulk_export'), (req, res) => res.json({}));
router.post('/bulk-update', checkPermission('tracker', 'update_any_row'), (req, res) => res.json({}));
router.post('/bulk-delete', checkPermission('tracker', 'delete_row'), (req, res) => res.json({}));

router.get('/reports/summary', checkPermission('tracker', 'view'), (req, res) => res.json({}));
router.get('/reports/user-wise', checkPermission('tracker', 'view'), (req, res) => res.json({}));
router.get('/reports/department-wise', checkPermission('tracker', 'view'), (req, res) => res.json({}));
router.get('/reports/delay', checkPermission('tracker', 'view'), (req, res) => res.json({}));
router.get('/reports/monthly', checkPermission('tracker', 'view'), (req, res) => res.json({}));

module.exports = router;
