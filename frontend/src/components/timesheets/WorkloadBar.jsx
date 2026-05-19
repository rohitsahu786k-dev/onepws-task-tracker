const WorkloadBar = ({ value = 0 }) => {
  const width = Math.min(Number(value || 0), 140);
  const color = value > 110 ? 'bg-rose-500' : value > 90 ? 'bg-amber-500' : value > 60 ? 'bg-emerald-500' : 'bg-sky-500';
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-40 overflow-hidden rounded bg-slate-100">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(width, 100)}%` }} />
      </div>
      <span className="w-12 text-right text-sm font-semibold">{value}%</span>
    </div>
  );
};

export default WorkloadBar;
