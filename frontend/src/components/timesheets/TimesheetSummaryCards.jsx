const formatHours = (minutes = 0, hours) => {
  if (hours !== undefined && hours !== null) return `${Number(hours || 0).toFixed(2)}h`;
  return `${Number((Number(minutes || 0) / 60).toFixed(2))}h`;
};

const TimesheetSummaryCards = ({ timesheet }) => {
  const items = [
    { label: 'Logged', value: formatHours(timesheet?.totalMinutes, timesheet?.totalHours) },
    { label: 'Expected', value: formatHours(timesheet?.expectedMinutes) },
    { label: 'Missing', value: formatHours(timesheet?.missingMinutes) },
    { label: 'Overtime', value: formatHours(timesheet?.overtimeMinutes) },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-slate-500">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
        </div>
      ))}
    </section>
  );
};

export default TimesheetSummaryCards;
