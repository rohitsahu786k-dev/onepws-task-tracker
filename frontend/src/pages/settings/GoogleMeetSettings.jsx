import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import * as settingsApi from '../../api/meetingSettings.api';

const GoogleMeetSettings = () => {
  const { workspace } = useAuthStore();
  const workspaceId = workspace?._id;
  const [form, setForm] = useState({ enabled: false, clientId: '', clientSecretEncrypted: '', redirectUri: '', refreshTokenEncrypted: '', connectedEmail: '' });

  useEffect(() => {
    if (workspaceId) settingsApi.getGoogleMeetSettings(workspaceId).then((res) => setForm((prev) => ({ ...prev, ...(res.data || {}) }))).catch(() => {});
  }, [workspaceId]);

  const save = async () => {
    await settingsApi.updateGoogleMeetSettings(workspaceId, form);
    toast.success('Google Meet settings saved');
  };

  const test = async () => {
    try {
      await settingsApi.testGoogleMeetSettings(workspaceId);
      toast.success('Google Meet connection successful');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Google Meet connection failed');
    }
  };

  return (
    <main className="mx-auto max-w-2xl space-y-5">
      <div><h1 className="text-2xl font-semibold">Google Meet Integration</h1><p className="text-sm text-slate-500">Store OAuth credentials used to create Calendar conference links.</p></div>
      <section className="space-y-4 rounded-lg border bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} /> Enable Google Meet</label>
        <Field label="OAuth Client ID" value={form.clientId || ''} onChange={(value) => setForm({ ...form, clientId: value })} />
        <Field label="OAuth Client Secret" type="password" value={form.clientSecretEncrypted || ''} onChange={(value) => setForm({ ...form, clientSecretEncrypted: value })} />
        <Field label="Redirect URL" value={form.redirectUri || ''} onChange={(value) => setForm({ ...form, redirectUri: value })} />
        <Field label="Refresh Token" type="password" value={form.refreshTokenEncrypted || ''} onChange={(value) => setForm({ ...form, refreshTokenEncrypted: value })} />
        <Field label="Connected Email" value={form.connectedEmail || ''} onChange={(value) => setForm({ ...form, connectedEmail: value })} />
        <div className="flex gap-2"><button onClick={save} className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white">Save</button><button onClick={test} className="rounded-md border px-3 py-2 text-sm">Test Connection</button></div>
      </section>
    </main>
  );
};

const Field = ({ label, value, onChange, type = 'text' }) => <label className="block space-y-1 text-sm"><span className="font-medium">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border px-3 py-2 dark:border-slate-700 dark:bg-slate-900" /></label>;

export default GoogleMeetSettings;
