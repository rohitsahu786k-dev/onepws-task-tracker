import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import * as permissionService from '../../services/permission.service';

const modules = ['dashboard', 'projects', 'tasks', 'tracker', 'calendar', 'media', 'mom', 'meetings', 'sla', 'intake', 'budget', 'expenses', 'reports', 'notes', 'wiki', 'vendors', 'notifications', 'email_templates', 'settings', 'activity_logs', 'backup'];
const actions = ['view', 'create', 'update', 'delete', 'approve', 'export', 'configure', 'assign', 'comment', 'upload', 'download', 'manage'];
const roles = ['admin', 'manager', 'member', 'viewer'];

function togglePermission(permissionConfig, moduleKey, action) {
  const next = structuredClone(permissionConfig);
  let modulePermission = next.permissions.find((item) => item.module === moduleKey);
  if (!modulePermission) {
    modulePermission = { module: moduleKey, actions: [] };
    next.permissions.push(modulePermission);
  }
  modulePermission.actions = modulePermission.actions.includes(action)
    ? modulePermission.actions.filter((item) => item !== action)
    : [...modulePermission.actions, action];
  return next;
}

export default function RolePermissions() {
  const workspaceId = useAuthStore((state) => state.workspace?._id || state.user?.defaultWorkspace);
  const [role, setRole] = useState('manager');
  const [configs, setConfigs] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const current = useMemo(
    () => configs.find((item) => item.role === role) || { role, permissions: [] },
    [configs, role]
  );

  const load = () => {
    if (!workspaceId) return;
    permissionService.getRolePermissions(workspaceId).then((res) => setConfigs(res.data || [])).catch(() => {});
  };

  useEffect(load, [workspaceId]);

  const updateCurrent = (nextConfig) => {
    setConfigs((state) => state.map((item) => (item.role === role ? nextConfig : item)));
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const res = await permissionService.updateRolePermissions(workspaceId, role, current.permissions);
      updateCurrent(res.data);
      toast.success('Role permissions saved');
    } finally {
      setIsSaving(false);
    }
  };

  const reset = async () => {
    const res = await permissionService.resetPermissions(workspaceId, role);
    setConfigs((state) => state.map((item) => res.data.find((next) => next.role === item.role) || item));
    toast.success('Role reset to default');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Roles & Permissions</h1>
          <p className="text-sm text-slate-500">Configure module actions by workspace role.</p>
        </div>
        <div className="flex gap-2">
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" value={role} onChange={(event) => setRole(event.target.value)}>
            {roles.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button type="button" onClick={reset} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium dark:border-slate-700">Reset</button>
          <button type="button" onClick={save} disabled={isSaving} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{isSaving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>

      <div className="overflow-auto rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900">
            <tr>
              <th className="sticky left-0 bg-slate-50 px-4 py-3 text-left dark:bg-slate-900">Module</th>
              {actions.map((action) => <th key={action} className="px-3 py-3 text-center">{action}</th>)}
            </tr>
          </thead>
          <tbody>
            {modules.map((moduleKey) => {
              const allowed = current.permissions.find((item) => item.module === moduleKey)?.actions || [];
              return (
                <tr key={moduleKey} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="sticky left-0 bg-white px-4 py-3 font-medium dark:bg-slate-950">{moduleKey}</td>
                  {actions.map((action) => (
                    <td key={action} className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={allowed.includes(action) || allowed.includes('*')}
                        onChange={() => updateCurrent(togglePermission(current, moduleKey, action))}
                        className="size-4 accent-primary"
                        aria-label={`${moduleKey}:${action}`}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
