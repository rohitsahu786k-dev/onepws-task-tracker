const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const keyFor = (date) => new Date(date).toISOString().slice(0, 10);

const WeeklyTimesheetGrid = ({ logs = [], timesheet }) => {
  const periodStart = timesheet?.periodStart ? new Date(timesheet.periodStart) : new Date();
  const days = dayLabels.map((label, index) => {
    const date = new Date(periodStart);
    date.setDate(periodStart.getDate() + index);
    return { label, key: keyFor(date) };
  });

  const rows = new Map();
  logs.forEach((log) => {
    const rowKey = log.task?._id || log.project?._id || log.workType || 'other';
    if (!rows.has(rowKey)) rows.set(rowKey, { label: log.task?.title || log.project?.title || log.workType || 'Other', days: {}, total: 0 });
    const row = rows.get(rowKey);
    const minutes = Number(log.durationMinutes || 0);
    row.days[keyFor(log.logDate)] = (row.days[keyFor(log.logDate)] || 0) + minutes;
    row.total += minutes;
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Task / Project</th>
            {days.map((day) => <th key={day.key} className="px-4 py-3">{day.label}</th>)}
            <th className="px-4 py-3">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from(rows.values()).map((row) => (
            <tr key={row.label}>
              <td className="px-4 py-3 font-medium">{row.label}</td>
              {days.map((day) => <td key={day.key} className="px-4 py-3">{Number((Number(row.days[day.key] || 0) / 60).toFixed(2))}h</td>)}
              <td className="px-4 py-3 font-semibold">{Number((row.total / 60).toFixed(2))}h</td>
            </tr>
          ))}
          {!rows.size && (
            <tr>
              <td colSpan="9" className="px-4 py-8 text-center text-slate-500">No weekly entries yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default WeeklyTimesheetGrid;
