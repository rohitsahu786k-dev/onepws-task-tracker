const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled, checkPermission } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/sla.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('sla'));

router.get('/', checkPermission('sla', 'view'), ctrl.configList);
router.post('/', checkPermission('sla', 'configure'), ctrl.configCreate);
router.get('/:configId', checkPermission('sla', 'view'), ctrl.configGet);
router.put('/:configId', checkPermission('sla', 'configure'), ctrl.configUpdate);
router.delete('/:configId', checkPermission('sla', 'configure'), ctrl.configRemove);
router.patch('/:configId/activate', checkPermission('sla', 'configure'), ctrl.configActivate);
router.patch('/:configId/deactivate', checkPermission('sla', 'configure'), ctrl.configDeactivate);
router.patch('/:configId/set-default', checkPermission('sla', 'configure'), ctrl.configSetDefault);
router.post('/:configId/clone', checkPermission('sla', 'configure'), ctrl.configClone);

module.exports = router;
