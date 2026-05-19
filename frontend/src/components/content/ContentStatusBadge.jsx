const styles = {
  idea: 'bg-slate-100 text-slate-700',
  brief_ready: 'bg-blue-100 text-blue-700',
  in_design: 'bg-violet-100 text-violet-700',
  copy_ready: 'bg-cyan-100 text-cyan-700',
  review: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  scheduled: 'bg-teal-100 text-teal-700',
  published: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  archived: 'bg-slate-200 text-slate-600'
};

export default function ContentStatusBadge({ status = 'idea' }) {
  return <span className={`rounded px-2 py-1 text-xs font-medium ${styles[status] || styles.idea}`}>{status.replaceAll('_', ' ')}</span>;
}
