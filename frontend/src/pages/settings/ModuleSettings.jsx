import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import * as permissionService from '../../services/permission.service';

const labels = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  tasks: 'Tasks',
  tracker: 'Daily Tracker',
  calendar: 'Calendar',
  reports: 'Reports',
  media: 'Media Library',
  mom: 'MOM',
  meetings: 'Meetings',
  sla: 'SLA',
  intake: 'Intake Forms',
  budget: 'Budget',
  expenses: 'Expenses',
  notes: 'Notes',
  wiki: 'Wiki',
  vendors: 'Vendors',
  notifications: 'Notifications',
  email_templates: 'Email Templates',
  settings: 'Settings',
  activity_logs: 'Activity Logs',
  backup: 'Backup',
  api_keys: 'API Keys'
};

export default function ModuleSettings() {
  const workspaceId = useAuthStore((state) => state.workspace?._id || state.user?.defaultWorkspace);
  const setPermissions = useAuthStore((state) => state.setPermissions);
  const [allowedModules, setAllowedModules] = useState({});
  const [dependencies, setDependencies] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    permissionService.getWorkspaceModules(workspaceId).then((res) => {
      setAllowedModules(res.data?.allowedModules || {});
      setDependencies(res.data?.dependencies || {});
    }).catch(() => {});
  }, [workspaceId]);

  const toggle = (key) => setAllowedModules((state) => ({ ...state, [key]: state[key] === false }));

  const save = async () => {
    setIsSaving(true);
    try {
      await permissionService.updateWorkspaceModules(workspaceId, allowedModules);
      const mine = await permissionService.getMyPermissions(workspaceId);
      setPermissions(mine.data);
      toast.success('Workspace modules updated');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Workspace Modules</h1>
          <p className="text-sm text-slate-500">Enable or disable feature modules for this workspace.</p>
        </div>
        <button type="button" onClick={save} disabled={isSaving} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {isSaving ? 'Saving...' : 'Save modules'}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(labels).map(([key, label]) => (
          <label key={key} className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <span className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-semibold">{label}</span>
                {dependencies[key]?.length > 0 && (
                  <span className="mt-1 block text-xs text-amber-600">Depends on: {dependencies[key].join(', ')}</span>
                )}
              </span>
              <input type="checkbox" checked={allowedModules[key] !== false} onChange={() => toggle(key)} className="size-4 accent-primary" />
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
