const express = require('express');
const router = express.Router();
const { protect, optionalProtect, verifyWorkspaceAccess } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/workspace.controller');

router.get('/my', protect, ctrl.getMyWorkspaces);
router.post('/invites/:token/accept', optionalProtect, ctrl.acceptInvite);
router.post('/', protect, ctrl.create);
router.get('/', protect, ctrl.getAll);

router.get('/:wid', protect, verifyWorkspaceAccess, ctrl.getById);
router.put('/:wid', protect, verifyWorkspaceAccess, ctrl.update);
router.delete('/:wid', protect, verifyWorkspaceAccess, ctrl.remove);
router.patch('/:wid/archive', protect, verifyWorkspaceAccess, ctrl.archive);
router.patch('/:wid/restore', protect, ctrl.restore);
router.post('/:wid/switch', protect, verifyWorkspaceAccess, ctrl.switchWorkspace);

router.get('/:wid/me/permissions', protect, verifyWorkspaceAccess, ctrl.getPermissions);
router.get('/:wid/permissions', protect, verifyWorkspaceAccess, ctrl.getPermissions);
router.get('/:wid/dashboard', protect, verifyWorkspaceAccess, ctrl.workspaceDashboard);
router.get('/:wid/activity', protect, verifyWorkspaceAccess, ctrl.workspaceActivity);

router.get('/:wid/settings', protect, verifyWorkspaceAccess, ctrl.getSettings);
router.put('/:wid/settings/general', protect, verifyWorkspaceAccess, ctrl.updateGeneralSettings);
router.put('/:wid/settings/branding', protect, verifyWorkspaceAccess, ctrl.updateBranding);
router.put('/:wid/settings/modules', protect, verifyWorkspaceAccess, ctrl.updateSettingsModules);
router.put('/:wid/settings/working-days', protect, verifyWorkspaceAccess, ctrl.updateWorkingDays);
router.put('/:wid/settings/storage', protect, verifyWorkspaceAccess, ctrl.updateStorage);

router.get('/:wid/modules', protect, verifyWorkspaceAccess, ctrl.getModules);
router.put('/:wid/modules', protect, verifyWorkspaceAccess, ctrl.updateModules);

router.get('/:wid/members', protect, verifyWorkspaceAccess, ctrl.listMembers);
router.post('/:wid/members', protect, verifyWorkspaceAccess, ctrl.addMember);
router.post('/:wid/users', protect, verifyWorkspaceAccess, ctrl.createUserForWorkspace);
router.get('/:wid/users', protect, verifyWorkspaceAccess, ctrl.listMembers);
router.get('/:wid/users/:userId', protect, verifyWorkspaceAccess, ctrl.getMember);
router.put('/:wid/users/:userId', protect, verifyWorkspaceAccess, ctrl.updateMember);
router.put('/:wid/members/:userId', protect, verifyWorkspaceAccess, ctrl.updateMember);
router.patch('/:wid/members/:userId/role', protect, verifyWorkspaceAccess, ctrl.updateMemberRole);
router.put('/:wid/members/:userId/role', protect, verifyWorkspaceAccess, ctrl.updateMemberRole);
router.patch('/:wid/users/:userId/role', protect, verifyWorkspaceAccess, ctrl.updateMemberRole);
router.patch('/:wid/members/:userId/department', protect, verifyWorkspaceAccess, ctrl.updateMemberDepartment);
router.put('/:wid/members/:userId/department', protect, verifyWorkspaceAccess, ctrl.updateMemberDepartment);
router.patch('/:wid/users/:userId/department', protect, verifyWorkspaceAccess, ctrl.updateMemberDepartment);
router.patch('/:wid/members/:userId/activate', protect, verifyWorkspaceAccess, ctrl.activateMember);
router.patch('/:wid/users/:userId/activate', protect, verifyWorkspaceAccess, ctrl.activateMember);
router.patch('/:wid/members/:userId/deactivate', protect, verifyWorkspaceAccess, ctrl.deactivateMember);
router.patch('/:wid/users/:userId/deactivate', protect, verifyWorkspaceAccess, ctrl.deactivateMember);
router.delete('/:wid/members/:userId', protect, verifyWorkspaceAccess, ctrl.removeMember);
router.post('/:wid/members/:userId/reassign', protect, verifyWorkspaceAccess, ctrl.reassignMemberWork);
router.post('/:wid/users/:userId/force-logout', protect, verifyWorkspaceAccess, ctrl.forceLogoutMember);
router.post('/:wid/users/:userId/send-reset-link', protect, verifyWorkspaceAccess, ctrl.reassignMemberWork);

router.get('/:wid/invites', protect, verifyWorkspaceAccess, ctrl.listInvites);
router.post('/:wid/invites', protect, verifyWorkspaceAccess, ctrl.createInvite);
router.delete('/:wid/invites/:inviteId', protect, verifyWorkspaceAccess, ctrl.cancelInvite);
router.post('/:wid/invites/:inviteId/resend', protect, verifyWorkspaceAccess, ctrl.resendInvite);

module.exports = router;
