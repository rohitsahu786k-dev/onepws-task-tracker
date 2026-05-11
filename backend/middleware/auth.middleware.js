const passport = require('passport');
require('../config/passport');
const Workspace = require('../models/Workspace');
const { ROLE_WEIGHT, getEffectiveAllowedModules, hasPermission, isSuperAdmin, normalizeRole } = require('../utils/permission');

const permissionDenied = (res, message, errorCode = 'PERMISSION_DENIED') =>
  res.status(403).json({ success: false, statusCode: 403, message, errorCode });

const protect = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: info?.message || 'Invalid or inactive user.',
        errorCode: 'UNAUTHENTICATED'
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};

const verifyWorkspaceAccess = async (req, res, next) => {
  try {
    const workspaceId = req.params.wid || req.params.workspaceId || req.body.workspace || req.query.workspace;
    if (!workspaceId) {
      return res.status(400).json({ success: false, statusCode: 400, message: 'Workspace ID is required' });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.isActive) {
      return res.status(404).json({ success: false, statusCode: 404, message: 'Workspace not found or inactive' });
    }

    if (isSuperAdmin(req.user)) {
      req.workspaceRole = 'super_admin';
      req.workspace = workspace;
      req.workspaceDepartment = null;
      req.workspaceMembership = null;
      req.allowedModules = getEffectiveAllowedModules(workspace, null, req.user);
      return next();
    }

    const membership = req.user.workspaces.find(
      (w) => w.workspace?.toString() === workspaceId.toString() && w.isActive !== false
    );

    if (!membership) {
      return permissionDenied(res, 'You do not have access to this workspace', 'WORKSPACE_ACCESS_DENIED');
    }

    req.workspace = workspace;
    req.workspaceRole = normalizeRole(membership.role);
    req.workspaceDepartment = membership.department;
    req.workspaceMembership = membership;
    req.allowedModules = getEffectiveAllowedModules(workspace, membership, req.user);
    next();
  } catch (error) {
    next(error);
  }
};

function checkRole(allowedRoles = []) {
  return function (req, res, next) {
    if (isSuperAdmin(req.user)) return next();
    const normalizedAllowed = allowedRoles.map(normalizeRole);
    if (!normalizedAllowed.includes(normalizeRole(req.workspaceRole))) {
      return permissionDenied(res, 'You do not have permission to perform this action');
    }
    next();
  };
}

function requireMinimumRole(requiredRole) {
  return function (req, res, next) {
    const userRole = isSuperAdmin(req.user) ? 'super_admin' : normalizeRole(req.workspaceRole);
    if ((ROLE_WEIGHT[userRole] || 0) < (ROLE_WEIGHT[requiredRole] || 0)) {
      return permissionDenied(res, `Minimum role required: ${requiredRole}`);
    }
    next();
  };
}

function checkModuleEnabled(moduleKey) {
  return function (req, res, next) {
    if (!req.workspace) return next();
    if (isSuperAdmin(req.user)) return next();
    const allowedModules = req.allowedModules || getEffectiveAllowedModules(req.workspace, req.workspaceMembership, req.user);
    if (allowedModules[moduleKey] === false) {
      return permissionDenied(res, `${moduleKey} module is disabled for this workspace`, 'MODULE_DISABLED');
    }
    next();
  };
}

function checkPermission(moduleKey, action) {
  return async function (req, res, next) {
    try {
      if (!req.workspace) return next();
      const allowed = await hasPermission(
        req.user,
        req.workspace,
        req.workspaceRole,
        moduleKey,
        action,
        req.workspaceMembership
      );

      if (!allowed) {
        return permissionDenied(res, `Permission denied: ${moduleKey}:${action}`);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  protect,
  verifyToken: protect,
  verifyWorkspaceAccess,
  checkRole,
  requireMinimumRole,
  checkModuleEnabled,
  checkPermission
};
