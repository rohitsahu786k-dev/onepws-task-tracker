const tones = {
  draft: 'bg-slate-100 text-slate-700',
  submitted: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
  reopened: 'bg-sky-100 text-sky-800',
  locked: 'bg-zinc-200 text-zinc-800',
};

const TimesheetStatusBadge = ({ status = 'draft' }) => (
  <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-semibold ${tones[status] || tones.draft}`}>
    {String(status).replace(/_/g, ' ')}
  </span>
);

export default TimesheetStatusBadge;
