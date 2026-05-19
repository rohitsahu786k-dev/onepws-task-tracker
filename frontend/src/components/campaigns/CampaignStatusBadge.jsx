const styles = {
  draft: 'bg-slate-100 text-slate-700',
  planned: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  on_hold: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  archived: 'bg-slate-200 text-slate-600'
};

export default function CampaignStatusBadge({ status = 'draft' }) {
  return <span className={`rounded px-2 py-1 text-xs font-medium ${styles[status] || styles.draft}`}>{status.replaceAll('_', ' ')}</span>;
}
