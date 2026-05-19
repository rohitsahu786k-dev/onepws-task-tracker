const User = require('../models/User');
const { getEffectiveAllowedModules, getEffectivePermissions, isSuperAdmin, normalizeRole } = require('../utils/permission');

async function buildUserPayload(userOrId) {
  const user = typeof userOrId === 'object' && userOrId.email
    ? userOrId
    : await User.findById(userOrId);

  if (!user) return null;
  const doc = user.toObject ? user.toObject() : user;
  delete doc.password;
  delete doc.refreshToken;
  delete doc.twoFactorSecret;
  delete doc.backupCodes;
  return doc;
}

async function buildWorkspacePermissions({ user, workspace, membership }) {
  const role = isSuperAdmin(user) ? 'super_admin' : normalizeRole(membership?.role || 'member');
  const allowedModules = getEffectiveAllowedModules(workspace, membership, user);
  const structured = await getEffectivePermissions(user, workspace, role, membership);
  const permissions = structured.flatMap((item) =>
    (item.actions || []).map((action) => item.module === '*' || action === '*' ? '*' : `${item.module}:${action}`)
  );

  return {
    role,
    department: membership?.department || null,
    allowedModules,
    permissions: permissions.includes('*') ? ['*'] : permissions
  };
}

module.exports = { buildUserPayload, buildWorkspacePermissions };
