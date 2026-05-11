const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled, checkPermission, checkRole } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/permission.controller');

router.use(protect, verifyWorkspaceAccess);

router.get('/me/permissions', ctrl.getMyPermissions);

router.get('/modules', checkModuleEnabled('settings'), checkPermission('settings', 'view'), ctrl.getModules);
router.put('/modules', checkModuleEnabled('settings'), checkPermission('settings', 'update_roles'), ctrl.updateModules);

router.use(checkRole(['admin']));

router.get('/permissions', ctrl.getPermissions);
router.get('/permissions/:role', ctrl.getRolePermissions);
router.put('/permissions/:role', ctrl.updateRolePermissions);
router.post('/permissions/reset-default', ctrl.resetToDefault);

router.get('/members', ctrl.getMembers);
router.put('/members/:userId/role', ctrl.updateMemberRole);
router.put('/members/:userId/department', ctrl.updateMemberDepartment);
router.delete('/members/:userId', ctrl.removeMember);

router.get('/custom-roles', ctrl.getCustomRoles);
router.post('/custom-roles', ctrl.createCustomRole);
router.get('/custom-roles/:id', ctrl.getCustomRole);
router.put('/custom-roles/:id', ctrl.updateCustomRole);
router.delete('/custom-roles/:id', ctrl.deleteCustomRole);

module.exports = router;
