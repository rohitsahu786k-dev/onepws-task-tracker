const events = [
  ['task_assigned', 'Task assigned', ['inApp', 'email', 'slack', 'telegram']],
  ['task_overdue', 'Task overdue', ['inApp', 'email', 'slack', 'telegram']],
  ['task_commented', 'Task comments', ['inApp', 'email']],
  ['mention', 'Mentions', ['inApp', 'email']],
  ['mom_created', 'MOM created', ['inApp', 'email']],
  ['mom_signed', 'MOM signed', ['inApp', 'email']],
  ['meeting_scheduled', 'Meeting scheduled', ['inApp', 'email']],
  ['meeting_reminder', 'Meeting reminders', ['inApp', 'email']],
  ['sla_breach', 'SLA breach', ['inApp', 'email', 'slack', 'telegram']],
  ['budget_approved', 'Budget approved', ['inApp', 'email']],
  ['expense_approved', 'Expense approved', ['inApp', 'email']],
  ['daily_digest', 'Daily digest', ['email']]
];

export default function NotificationPreferencePanel({ value, onChange, onSave, isSaving }) {
  const preferences = value?.preferences || {};

  const toggle = (eventKey, channel) => {
    onChange({
      ...value,
      preferences: {
        ...preferences,
        [eventKey]: {
          ...(preferences[eventKey] || {}),
          [channel]: preferences[eventKey]?.[channel] === false
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="grid grid-cols-[1fr_repeat(4,5rem)] border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800">
          <span>Event</span>
          <span>In-app</span>
          <span>Email</span>
          <span>Slack</span>
          <span>Telegram</span>
        </div>
        {events.map(([eventKey, label, channels]) => (
          <div key={eventKey} className="grid grid-cols-[1fr_repeat(4,5rem)] items-center border-b border-slate-100 px-4 py-3 last:border-0 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</span>
            {['inApp', 'email', 'slack', 'telegram'].map((channel) => (
              <span key={channel}>
                {channels.includes(channel) ? (
                  <input
                    type="checkbox"
                    checked={preferences[eventKey]?.[channel] !== false}
                    onChange={() => toggle(eventKey, channel)}
                    className="size-4 accent-primary"
                    aria-label={`${label} ${channel}`}
                  />
                ) : (
                  <span className="text-slate-300">-</span>
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isSaving ? 'Saving...' : 'Save preferences'}
      </button>
    </div>
  );
}
