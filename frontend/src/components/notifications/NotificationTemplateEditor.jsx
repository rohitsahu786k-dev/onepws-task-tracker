const events = [
  'task_assigned',
  'task_overdue',
  'task_due_today',
  'task_due_tomorrow',
  'mention',
  'mom_created',
  'mom_signed',
  'mom_pending_signature',
  'meeting_scheduled',
  'meeting_reminder',
  'sla_breach',
  'sla_escalation',
  'budget_approved',
  'budget_rejected',
  'expense_approved',
  'expense_rejected',
  'daily_digest'
];

export default function NotificationTemplateEditor({ type = 'notification', value, onChange, onSubmit, onCancel, isSaving }) {
  const isEmail = type === 'email';

  const update = (field, fieldValue) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-4 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Name</span>
          <input className="w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" value={value.name || ''} onChange={(event) => update('name', event.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Event</span>
          <select className="w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" value={value.event || ''} onChange={(event) => update('event', event.target.value)} required>
            <option value="">Select event</option>
            {events.map((eventKey) => (
              <option key={eventKey} value={eventKey}>{eventKey}</option>
            ))}
          </select>
        </label>
      </div>

      {!isEmail && (
        <label className="space-y-1 text-sm">
          <span className="font-medium">Channel</span>
          <select className="w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" value={value.channel || 'in_app'} onChange={(event) => update('channel', event.target.value)}>
            <option value="in_app">In-app</option>
            <option value="slack">Slack</option>
            <option value="telegram">Telegram</option>
          </select>
        </label>
      )}

      <label className="space-y-1 text-sm">
        <span className="font-medium">{isEmail ? 'Subject' : 'Title template'}</span>
        <input className="w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" value={isEmail ? value.subject || '' : value.titleTemplate || ''} onChange={(event) => update(isEmail ? 'subject' : 'titleTemplate', event.target.value)} />
      </label>

      <label className="space-y-1 text-sm">
        <span className="font-medium">{isEmail ? 'HTML body' : 'Body template'}</span>
        <textarea className="min-h-44 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-900" value={isEmail ? value.htmlBody || '' : value.bodyTemplate || ''} onChange={(event) => update(isEmail ? 'htmlBody' : 'bodyTemplate', event.target.value)} />
      </label>

      {isEmail && (
        <label className="space-y-1 text-sm">
          <span className="font-medium">Text body</span>
          <textarea className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" value={value.textBody || ''} onChange={(event) => update('textBody', event.target.value)} />
        </label>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium dark:border-slate-700">Cancel</button>
        <button type="submit" disabled={isSaving} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {isSaving ? 'Saving...' : 'Save template'}
        </button>
      </div>
    </form>
  );
}
