import { useState } from 'react';
import { Plus } from 'lucide-react';

const defaultForm = {
  logDate: new Date().toISOString().slice(0, 10),
  task: '',
  project: '',
  durationMinutes: 60,
  workType: 'task_work',
  description: '',
  billable: false,
};

const TimeLogForm = ({ onSubmit, disabled }) => {
  const [form, setForm] = useState(defaultForm);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    await onSubmit?.({
      ...form,
      durationMinutes: Number(form.durationMinutes),
      task: form.task || undefined,
      project: form.project || undefined,
    });
    setForm(defaultForm);
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-6">
        <input type="date" value={form.logDate} onChange={(event) => update('logDate', event.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm" required />
        <input value={form.task} onChange={(event) => update('task', event.target.value)} placeholder="Task ID" className="rounded border border-slate-300 px-3 py-2 text-sm" />
        <input value={form.project} onChange={(event) => update('project', event.target.value)} placeholder="Project ID" className="rounded border border-slate-300 px-3 py-2 text-sm" />
        <input type="number" min="1" max="1440" value={form.durationMinutes} onChange={(event) => update('durationMinutes', event.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm" required />
        <select value={form.workType} onChange={(event) => update('workType', event.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="task_work">Task work</option>
          <option value="meeting">Meeting</option>
          <option value="review">Review</option>
          <option value="planning">Planning</option>
          <option value="coordination">Coordination</option>
          <option value="revision">Revision</option>
          <option value="other">Other</option>
        </select>
        <label className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm">
          <input type="checkbox" checked={form.billable} onChange={(event) => update('billable', event.target.checked)} />
          Billable
        </label>
      </div>
      <div className="mt-3 flex gap-3">
        <input value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Work description" className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm" required />
        <button disabled={disabled} type="submit" className="inline-flex items-center gap-2 rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          <Plus size={16} /> Add
        </button>
      </div>
    </form>
  );
};

export default TimeLogForm;
