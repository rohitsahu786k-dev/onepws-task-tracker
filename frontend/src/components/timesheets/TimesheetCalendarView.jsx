const TimesheetCalendarView = ({ dailySummary = [] }) => (
  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
    {dailySummary.map((day) => (
      <div key={day.date} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <p className="text-xs font-medium uppercase text-slate-500">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{new Date(day.date).toLocaleDateString()}</p>
        <p className="mt-2 text-lg font-semibold">{Number((Number(day.totalMinutes || 0) / 60).toFixed(2))}h</p>
        <p className="text-xs text-slate-500">{day.status}</p>
      </div>
    ))}
  </div>
);

export default TimesheetCalendarView;
