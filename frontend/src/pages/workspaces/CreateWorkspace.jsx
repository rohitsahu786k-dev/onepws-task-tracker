import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import workspaceApi from '../../api/workspace.api';

const moduleKeys = ['tasks', 'tracker', 'calendar', 'mom', 'meetings', 'reports', 'media', 'sla', 'intake', 'budget', 'expenses'];

const CreateWorkspace = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    companyName: '',
    description: '',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    allowedModules: moduleKeys.reduce((acc, key) => ({ ...acc, [key]: !['budget', 'expenses'].includes(key) }), {})
  });
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await workspaceApi.create(form);
      toast.success('Workspace created');
      navigate(`/workspaces/${res.data?._id || res.workspace?._id}/settings`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Workspace creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-6">
      <form onSubmit={submit} className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Create Workspace</h1>
        </header>
        <section className="grid gap-4 md:grid-cols-2">
          <input required placeholder="Workspace name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="rounded-md border px-3 py-2" />
          <input placeholder="Company name" value={form.companyName} onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))} className="rounded-md border px-3 py-2" />
          <input placeholder="Timezone" value={form.timezone} onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))} className="rounded-md border px-3 py-2" />
          <input placeholder="Currency" value={form.currency} onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))} className="rounded-md border px-3 py-2" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="md:col-span-2 rounded-md border px-3 py-2" />
        </section>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {moduleKeys.map((key) => (
            <label key={key} className="flex items-center gap-2 rounded-md border p-3 text-sm">
              <input type="checkbox" checked={Boolean(form.allowedModules[key])} onChange={(e) => setForm((prev) => ({ ...prev, allowedModules: { ...prev.allowedModules, [key]: e.target.checked } }))} />
              <span className="capitalize">{key}</span>
            </label>
          ))}
        </section>
        <button disabled={loading} className="rounded-md bg-primary px-4 py-2 text-white disabled:opacity-70">{loading ? 'Creating...' : 'Create workspace'}</button>
      </form>
    </main>
  );
};

export default CreateWorkspace;
