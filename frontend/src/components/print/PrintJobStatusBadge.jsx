const styles = {
  draft: 'bg-slate-100 text-slate-700',
  artwork_pending: 'bg-blue-100 text-blue-700',
  artwork_review: 'bg-amber-100 text-amber-700',
  quotation_selected: 'bg-indigo-100 text-indigo-700',
  sent_to_vendor: 'bg-cyan-100 text-cyan-700',
  proof_review: 'bg-amber-100 text-amber-700',
  proof_approved: 'bg-green-100 text-green-700',
  in_production: 'bg-violet-100 text-violet-700',
  ready_for_dispatch: 'bg-teal-100 text-teal-700',
  dispatched: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-green-100 text-green-700',
  reprint_required: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700'
};

export default function PrintJobStatusBadge({ status = 'draft' }) {
  return <span className={`rounded px-2 py-1 text-xs font-medium ${styles[status] || styles.draft}`}>{status.replaceAll('_', ' ')}</span>;
}
