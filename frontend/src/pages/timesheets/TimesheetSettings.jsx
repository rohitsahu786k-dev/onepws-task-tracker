import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import timesheetApi from '../../api/timesheet.api';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace || null;

const TimesheetSettings = () => {
  const { workspace, user } = useAuthStore();
  const workspaceId = getWorkspaceId(workspace) || getWorkspaceId(user?.defaultWorkspace);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (workspaceId) timesheetApi.settings(workspaceId).then((res) => setForm(res.settings || res.data || {})).catch(() => {});
  }, [workspaceId]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const save = async () => {
    await timesheetApi.updateSettings(workspaceId, form);
    toast.success('Timesheet settings saved');
  };

  return (
    <main className="space-y-4">
      <header><h1 className="text-2xl font-semibold text-slate-900">Timesheet Settings</h1></header>
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">Period
          <select value={form.periodType || 'weekly'} onChange={(event) => update('periodType', event.target.value)} className="block w-full rounded border border-slate-300 px-3 py-2">
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">Week start
          <select value={form.weekStartDay || 'monday'} onChange={(event) => update('weekStartDay', event.target.value)} className="block w-full rounded border border-slate-300 px-3 py-2">
            <option value="monday">Monday</option>
            <option value="sunday">Sunday</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">Expected hours per day
          <input type="number" value={form.expectedHoursPerDay || 8} onChange={(event) => update('expectedHoursPerDay', Number(event.target.value))} className="block w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium">Past edit limit days
          <input type="number" value={form.pastDateEditLimitDays || 7} onChange={(event) => update('pastDateEditLimitDays', Number(event.target.value))} className="block w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        {['allowManualEntry', 'allowTimer', 'requireTaskForTimeLog', 'requireDescription', 'requireApproval', 'autoLockAfterApproval'].map((field) => (
          <label key={field} className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form[field] !== false} onChange={(event) => update(field, event.target.checked)} />
            {field.replace(/([A-Z])/g, ' $1')}
          </label>
        ))}
      </section>
      <button type="button" onClick={save} className="rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Save settings</button>
    </main>
  );
};

export default TimesheetSettings;
