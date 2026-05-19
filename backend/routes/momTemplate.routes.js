const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled, checkPermission } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/mom.controller');

router.use(protect, verifyWorkspaceAccess, checkModuleEnabled('mom'));

router.get('/', checkPermission('mom', 'view'), ctrl.listTemplates);
router.post('/', checkPermission('mom', 'create'), ctrl.createTemplate);
router.get('/:templateId', checkPermission('mom', 'view'), ctrl.getTemplate);
router.put('/:templateId', checkPermission('mom', 'update'), ctrl.updateTemplate);
router.delete('/:templateId', checkPermission('mom', 'delete'), ctrl.deleteTemplate);
router.patch('/:templateId/set-default', checkPermission('mom', 'update'), ctrl.setDefaultTemplate);
router.post('/:templateId/clone', checkPermission('mom', 'create'), ctrl.cloneTemplate);

module.exports = router;
