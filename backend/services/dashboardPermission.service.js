function canAccessModule({ widget, req }) {
  if (!widget?.moduleKey) return true;
  if (req.user?.globalRole === 'super_admin') return true;
  const allowedModules = req.allowedModules || {};
  return allowedModules[widget.moduleKey] !== false;
}

function canViewWidget({ widget, req }) {
  if (!widget || widget.isActive === false) return false;
  if (!canAccessModule({ widget, req })) return false;
  if (widget.allowedRoles?.length) {
    const role = req.workspaceRole;
    if (!widget.allowedRoles.includes(role) && !['owner', 'admin', 'super_admin'].includes(role)) return false;
  }
  return true;
}

module.exports = { canViewWidget };
