import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import * as settingsApi from '../../api/meetingSettings.api';

const ZoomSettings = () => {
  const { workspace } = useAuthStore();
  const workspaceId = workspace?._id;
  const [form, setForm] = useState({ enabled: false, accountId: '', clientId: '', clientSecretEncrypted: '', defaultDurationMinutes: 60 });

  useEffect(() => {
    if (workspaceId) settingsApi.getZoomSettings(workspaceId).then((res) => setForm((prev) => ({ ...prev, ...(res.data || {}) }))).catch(() => {});
  }, [workspaceId]);

  const save = async () => {
    await settingsApi.updateZoomSettings(workspaceId, form);
    toast.success('Zoom settings saved');
  };

  const test = async () => {
    try {
      await settingsApi.testZoomSettings(workspaceId);
      toast.success('Zoom connection successful');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Zoom connection failed');
    }
  };

  return (
    <SettingsShell title="Zoom Integration" description="Configure Zoom Server-to-Server OAuth for meeting link generation.">
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} /> Enable Zoom Integration</label>
      <Field label="Zoom Account ID" value={form.accountId || ''} onChange={(value) => setForm({ ...form, accountId: value })} />
      <Field label="Zoom Client ID" value={form.clientId || ''} onChange={(value) => setForm({ ...form, clientId: value })} />
      <Field label="Zoom Client Secret" type="password" value={form.clientSecretEncrypted || ''} onChange={(value) => setForm({ ...form, clientSecretEncrypted: value })} />
      <Field label="Default Duration Minutes" type="number" value={form.defaultDurationMinutes || 60} onChange={(value) => setForm({ ...form, defaultDurationMinutes: Number(value) })} />
      <div className="flex gap-2"><button onClick={save} className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white">Save</button><button onClick={test} className="rounded-md border px-3 py-2 text-sm">Test Connection</button></div>
    </SettingsShell>
  );
};

const SettingsShell = ({ title, description, children }) => <main className="mx-auto max-w-2xl space-y-5"><div><h1 className="text-2xl font-semibold">{title}</h1><p className="text-sm text-slate-500">{description}</p></div><section className="space-y-4 rounded-lg border bg-white p-5 dark:border-slate-800 dark:bg-slate-950">{children}</section></main>;
const Field = ({ label, value, onChange, type = 'text' }) => <label className="block space-y-1 text-sm"><span className="font-medium">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border px-3 py-2 dark:border-slate-700 dark:bg-slate-900" /></label>;

export default ZoomSettings;
