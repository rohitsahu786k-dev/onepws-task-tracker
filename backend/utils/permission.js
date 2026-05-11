const PermissionConfig = require('../models/PermissionConfig');
const CustomRole = require('../models/CustomRole');
const { DEFAULT_ROLE_PERMISSIONS, DEFAULT_ALLOWED_MODULES } = require('../constants/defaultPermissions');

const ROLE_WEIGHT = { viewer: 10, member: 20, manager: 30, admin: 40, owner: 40, super_admin: 50 };

function isSuperAdmin(user) {
  return user?.globalRole === 'super_admin' || user?.role === 'super_admin';
}

function normalizeRole(role) {
  return role === 'owner' ? 'admin' : role;
}

function hasAction(permissions = [], moduleKey, action) {
  const wildcard = permissions.find((p) => p.module === '*');
  if (wildcard?.actions?.includes('*')) return true;

  const modulePermission = permissions.find((p) => p.module === moduleKey);
  if (!modulePermission) return false;

  return modulePermission.actions.includes('*') || modulePermission.actions.includes(action);
}

function mergePermissions(base = [], override = []) {
  const merged = new Map();
  [...base, ...override].forEach((item) => {
    if (!item?.module) return;
    const existing = merged.get(item.module) || new Set();
    (item.actions || []).forEach((action) => existing.add(action));
    merged.set(item.module, existing);
  });
  return [...merged.entries()].map(([module, actions]) => ({ module, actions: [...actions] }));
}

async function getEffectivePermissions(user, workspace, workspaceRole, membership) {
  if (isSuperAdmin(user)) return [{ module: '*', actions: ['*'] }];

  const role = normalizeRole(workspaceRole);
  let permissions = [];
  const permissionConfig = await PermissionConfig.findOne({ workspace: workspace._id, role });

  if (permissionConfig) {
    permissions = permissionConfig.permissions || [];
  } else {
    permissions = DEFAULT_ROLE_PERMISSIONS[role] || [];
  }

  if (membership?.customRole) {
    const customRole = await CustomRole.findOne({
      _id: membership.customRole,
      workspace: workspace._id,
      isActive: true
    });
    if (customRole) permissions = mergePermissions(permissions, customRole.permissions);
  }

  if (membership?.customPermissions?.length) {
    permissions = mergePermissions(permissions, membership.customPermissions);
  }

  return permissions;
}

async function hasPermission(user, workspace, workspaceRole, moduleKey, action, membership) {
  if (isSuperAdmin(user)) return true;
  const permissions = await getEffectivePermissions(user, workspace, workspaceRole, membership);
  return hasAction(permissions, moduleKey, action);
}

function getEffectiveAllowedModules(workspace, membership, user) {
  if (isSuperAdmin(user)) return DEFAULT_ALLOWED_MODULES;

  const allowedModules = { ...DEFAULT_ALLOWED_MODULES, ...(workspace?.allowedModules?.toObject?.() || workspace?.allowedModules || {}) };
  (membership?.allowedModulesOverride || []).forEach((moduleKey) => {
    allowedModules[moduleKey] = true;
  });
  (membership?.deniedModulesOverride || []).forEach((moduleKey) => {
    allowedModules[moduleKey] = false;
  });
  return allowedModules;
}

function checkAnyPermission(permissionChecks = []) {
  return async function (req, res, next) {
    try {
      if (!req.workspace) return next();
      for (const item of permissionChecks) {
        const allowed = await hasPermission(
          req.user,
          req.workspace,
          req.workspaceRole,
          item.module,
          item.action,
          req.workspaceMembership
        );
        if (allowed) return next();
      }

      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'Permission denied',
        errorCode: 'PERMISSION_DENIED'
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  ROLE_WEIGHT,
  isSuperAdmin,
  normalizeRole,
  hasAction,
  hasPermission,
  getEffectivePermissions,
  getEffectiveAllowedModules,
  checkAnyPermission
};
