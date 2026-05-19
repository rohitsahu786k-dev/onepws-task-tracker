import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import settingsApi from '../../api/settings.api';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace || null;

const categories = ['general', 'branding', 'modules', 'tasks', 'tracker', 'calendar', 'notifications', 'email', 'meetings', 'mom', 'sla', 'reports', 'media', 'budget-expenses', 'timesheets', 'notes', 'security', 'automation'];

const Settings = ({ category: initialCategory = 'general' }) => {
  const { workspace, user } = useAuthStore();
  const workspaceId = getWorkspaceId(workspace) || getWorkspaceId(user?.defaultWorkspace);
  const [category, setCategory] = useState(initialCategory);
  const [settings, setSettings] = useState({});
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    if (workspaceId) settingsApi.get(workspaceId, category).then((res) => setSettings(res.settings || res.data || {})).catch(() => {});
  }, [workspaceId, category]);

  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));

  const save = async () => {
    const res = await settingsApi.update(workspaceId, category, settings);
    setWarnings(res.warnings || []);
    toast.success('Settings saved');
  };

  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">{category.replace(/-/g, ' ')}</p>
      </header>
      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          {categories.map((item) => (
            <button key={item} type="button" onClick={() => setCategory(item)} className={`mb-1 block w-full rounded px-3 py-2 text-left text-sm capitalize ${category === item ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
              {item.replace(/-/g, ' ')}
            </button>
          ))}
        </aside>
        <section className="space-y-4">
          {!!warnings.length && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {warnings.map((warning) => <p key={warning}>{warning}</p>)}
            </div>
          )}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(settings || {}).filter(([, value]) => typeof value !== 'object' || value === null).map(([key, value]) => (
                <label key={key} className="space-y-1 text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                  {typeof value === 'boolean' ? (
                    <input type="checkbox" checked={value} onChange={(event) => update(key, event.target.checked)} className="ml-2" />
                  ) : (
                    <input value={value ?? ''} onChange={(event) => update(key, event.target.value)} className="block w-full rounded border border-slate-300 px-3 py-2 text-sm normal-case" />
                  )}
                </label>
              ))}
            </div>
            <button type="button" onClick={save} className="mt-4 rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Save settings</button>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Settings;
