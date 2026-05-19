import React from 'react';

const variants = {
  draft: 'bg-slate-100 text-slate-700',
  pending_review: 'bg-amber-100 text-amber-800',
  published: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
  needs_update: 'bg-orange-100 text-orange-800',
  archived: 'bg-slate-200 text-slate-700',
  deprecated: 'bg-zinc-200 text-zinc-700',
};

const labels = {
  pending_review: 'Pending Review',
  needs_update: 'Needs Update',
};

export default function WikiStatusBadge({ status = 'draft' }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${variants[status] || variants.draft}`}>
      {labels[status] || status.replaceAll('_', ' ')}
    </span>
  );
}
