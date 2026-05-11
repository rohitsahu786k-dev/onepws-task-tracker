const asyncHandler = require('../utils/asyncHandler');
const PermissionConfig = require('../models/PermissionConfig');
const CustomRole = require('../models/CustomRole');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const {
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_ALLOWED_MODULES,
  MODULE_DEPENDENCIES
} = require('../constants/defaultPermissions');
const { getEffectiveAllowedModules, getEffectivePermissions, isSuperAdmin } = require('../utils/permission');

async function logPermissionChange(req, action, description, refModel, refId, oldValue, newValue) {
  await ActivityLog.create({
    workspace: req.params.wid,
    user: req.user._id,
    module: 'permissions',
    action,
    refModel,
    refId,
    description,
    oldValue,
    newValue,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });
}

const getPermissions = asyncHandler(async (req, res) => {
  const existing = await PermissionConfig.find({ workspace: req.params.wid });
  const roles = ['admin', 'manager', 'member', 'viewer'];
  const data = roles.map((role) => existing.find((item) => item.role === role) || {
    workspace: req.params.wid,
    role,
    permissions: DEFAULT_ROLE_PERMISSIONS[role] || [],
    isSystemDefault: true
  });
  res.json({ success: true, data });
});

const getRolePermissions = asyncHandler(async (req, res) => {
  const role = req.params.role === 'owner' ? 'admin' : req.params.role;
  const permission = await PermissionConfig.findOne({ workspace: req.params.wid, role });
  res.json({
    success: true,
    data: permission || {
      workspace: req.params.wid,
      role,
      permissions: DEFAULT_ROLE_PERMISSIONS[role] || [],
      isSystemDefault: true
    }
  });
});

const updateRolePermissions = asyncHandler(async (req, res) => {
  const role = req.params.role === 'owner' ? 'admin' : req.params.role;
  const oldConfig = await PermissionConfig.findOne({ workspace: req.params.wid, role });
  const permission = await PermissionConfig.findOneAndUpdate(
    { workspace: req.params.wid, role },
    { permissions: req.body.permissions || [], updatedBy: req.user._id, isSystemDefault: false },
    { new: true, upsert: true, runValidators: true }
  );

  await logPermissionChange(
    req,
    'permission_changed',
    `Updated permissions for role: ${role}`,
    'PermissionConfig',
    permission._id,
    oldConfig?.permissions,
    permission.permissions
  );

  res.json({ success: true, data: permission });
});

const resetToDefault = asyncHandler(async (req, res) => {
  const roles = req.body.role ? [req.body.role] : ['admin', 'manager', 'member', 'viewer'];
  const updated = [];

  for (const roleName of roles) {
    const role = roleName === 'owner' ? 'admin' : roleName;
    const permission = await PermissionConfig.findOneAndUpdate(
      { workspace: req.params.wid, role },
      {
        permissions: DEFAULT_ROLE_PERMISSIONS[role] || [],
        isSystemDefault: true,
        updatedBy: req.user._id
      },
      { new: true, upsert: true }
    );
    updated.push(permission);
  }

  await logPermissionChange(req, 'permission_reset', 'Reset role permissions to defaults', 'Workspace', req.params.wid, null, roles);
  res.json({ success: true, data: updated });
});

const getCustomRoles = asyncHandler(async (req, res) => {
  const roles = await CustomRole.find({ workspace: req.params.wid }).sort({ name: 1 });
  res.json({ success: true, data: roles });
});

const getCustomRole = asyncHandler(async (req, res) => {
  const role = await CustomRole.findOne({ _id: req.params.id, workspace: req.params.wid });
  if (!role) return res.status(404).json({ success: false, message: 'Custom role not found' });
  res.json({ success: true, data: role });
});

const createCustomRole = asyncHandler(async (req, res) => {
  const role = await CustomRole.create({ ...req.body, workspace: req.params.wid, createdBy: req.user._id });
  await logPermissionChange(req, 'custom_role_created', `Created custom role: ${role.name}`, 'CustomRole', role._id, null, role);
  res.status(201).json({ success: true, data: role });
});

const updateCustomRole = asyncHandler(async (req, res) => {
  const oldRole = await CustomRole.findOne({ _id: req.params.id, workspace: req.params.wid });
  const role = await CustomRole.findOneAndUpdate(
    { _id: req.params.id, workspace: req.params.wid },
    req.body,
    { new: true, runValidators: true }
  );
  if (!role) return res.status(404).json({ success: false, message: 'Custom role not found' });
  await logPermissionChange(req, 'custom_role_updated', `Updated custom role: ${role.name}`, 'CustomRole', role._id, oldRole, role);
  res.json({ success: true, data: role });
});

const deleteCustomRole = asyncHandler(async (req, res) => {
  const role = await CustomRole.findOneAndUpdate(
    { _id: req.params.id, workspace: req.params.wid },
    { isActive: false },
    { new: true }
  );
  if (!role) return res.status(404).json({ success: false, message: 'Custom role not found' });
  await User.updateMany(
    { 'workspaces.workspace': req.params.wid, 'workspaces.customRole': role._id },
    { $unset: { 'workspaces.$.customRole': '' } }
  );
  await logPermissionChange(req, 'custom_role_deleted', `Disabled custom role: ${role.name}`, 'CustomRole', role._id, role, null);
  res.json({ success: true, message: 'Custom role disabled' });
});

const getModules = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      allowedModules: getEffectiveAllowedModules(req.workspace, req.workspaceMembership, req.user),
      dependencies: MODULE_DEPENDENCIES
    }
  });
});

const updateModules = asyncHandler(async (req, res) => {
  const oldModules = req.workspace.allowedModules;
  const nextModules = { ...DEFAULT_ALLOWED_MODULES, ...(req.body.allowedModules || {}) };
  const workspace = await Workspace.findByIdAndUpdate(
    req.params.wid,
    { allowedModules: nextModules },
    { new: true }
  );

  await logPermissionChange(req, 'modules_updated', 'Updated workspace allowed modules', 'Workspace', workspace._id, oldModules, workspace.allowedModules);
  res.json({ success: true, data: workspace.allowedModules, dependencies: MODULE_DEPENDENCIES });
});

const getMembers = asyncHandler(async (req, res) => {
  const workspace = await Workspace.findById(req.params.wid).populate('members.user', 'name email avatar designation isActive');
  res.json({ success: true, data: workspace.members.filter((member) => member.isActive !== false) });
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { role, customRole, allowedModulesOverride, deniedModulesOverride, customPermissions } = req.body;
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const membership = user.workspaces.find((item) => item.workspace?.toString() === req.params.wid);
  if (!membership) return res.status(404).json({ success: false, message: 'Workspace membership not found' });
  const oldValue = membership.toObject();

  if (role) membership.role = role;
  if (customRole !== undefined) membership.customRole = customRole || undefined;
  if (allowedModulesOverride) membership.allowedModulesOverride = allowedModulesOverride;
  if (deniedModulesOverride) membership.deniedModulesOverride = deniedModulesOverride;
  if (customPermissions) membership.customPermissions = customPermissions;
  await user.save();

  await Workspace.updateOne(
    { _id: req.params.wid, 'members.user': req.params.userId },
    { $set: { 'members.$.role': membership.role, 'members.$.isActive': true } }
  );

  await logPermissionChange(req, 'role_changed', `Changed role for ${user.email}`, 'User', user._id, oldValue, membership.toObject());
  res.json({ success: true, data: membership });
});

const updateMemberDepartment = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const membership = user.workspaces.find((item) => item.workspace?.toString() === req.params.wid);
  if (!membership) return res.status(404).json({ success: false, message: 'Workspace membership not found' });

  const oldValue = membership.department;
  membership.department = req.body.department || null;
  await user.save();
  await Workspace.updateOne(
    { _id: req.params.wid, 'members.user': req.params.userId },
    { $set: { 'members.$.department': membership.department } }
  );

  await logPermissionChange(req, 'department_assigned', `Updated department for ${user.email}`, 'User', user._id, oldValue, membership.department);
  res.json({ success: true, data: membership });
});

const removeMember = asyncHandler(async (req, res) => {
  await User.updateOne(
    { _id: req.params.userId, 'workspaces.workspace': req.params.wid },
    { $set: { 'workspaces.$.isActive': false } }
  );
  await Workspace.updateOne(
    { _id: req.params.wid, 'members.user': req.params.userId },
    { $set: { 'members.$.isActive': false } }
  );
  await logPermissionChange(req, 'user_removed', `Removed user from workspace`, 'User', req.params.userId, true, false);
  res.json({ success: true, message: 'Member removed from workspace' });
});

const getMyPermissions = asyncHandler(async (req, res) => {
  const role = isSuperAdmin(req.user) ? 'super_admin' : req.workspaceRole;
  const permissions = await getEffectivePermissions(req.user, req.workspace, role, req.workspaceMembership);

  res.json({
    success: true,
    data: {
      globalRole: isSuperAdmin(req.user) ? 'super_admin' : req.user.globalRole || 'user',
      role,
      department: req.workspaceDepartment,
      allowedModules: getEffectiveAllowedModules(req.workspace, req.workspaceMembership, req.user),
      permissions
    }
  });
});

module.exports = {
  getPermissions,
  getRolePermissions,
  updateRolePermissions,
  resetToDefault,
  getCustomRoles,
  getCustomRole,
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
  getModules,
  updateModules,
  getMembers,
  updateMemberRole,
  updateMemberDepartment,
  removeMember,
  getMyPermissions
};
