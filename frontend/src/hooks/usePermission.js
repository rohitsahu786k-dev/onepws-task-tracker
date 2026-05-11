import useAuthStore from '../store/authStore';

function hasAction(permissions, moduleKey, action) {
  const wildcard = permissions?.find((item) => item.module === '*');
  if (wildcard?.actions?.includes('*')) return true;
  const modulePermission = permissions?.find((item) => item.module === moduleKey);
  return Boolean(modulePermission?.actions?.includes('*') || modulePermission?.actions?.includes(action));
}

export function usePermission() {
  const user = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);
  const allowedModules = useAuthStore((state) => state.allowedModules);
  const permissionsLoaded = useAuthStore((state) => state.permissionsLoaded);

  function isModuleEnabled(moduleKey) {
    if (user?.globalRole === 'super_admin' || user?.role === 'super_admin') return true;
    return allowedModules?.[moduleKey] !== false;
  }

  function can(permission) {
    if (!permission) return true;
    if (user?.globalRole === 'super_admin' || user?.role === 'super_admin') return true;

    const [moduleKey, action] = permission.split(':');
    if (!isModuleEnabled(moduleKey)) return false;
    return hasAction(permissions, moduleKey, action);
  }

  return { can, isModuleEnabled, permissionsLoaded, permissions, allowedModules };
}
