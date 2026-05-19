import React from 'react';

const colors = {
  active: 'bg-emerald-100 text-emerald-800',
  invited: 'bg-blue-100 text-blue-800',
  pending: 'bg-amber-100 text-amber-800',
  on_leave: 'bg-orange-100 text-orange-800',
  inactive: 'bg-slate-200 text-slate-700',
  suspended: 'bg-rose-100 text-rose-800',
  terminated: 'bg-zinc-200 text-zinc-700',
};

export default function EmployeeStatusBadge({ status = 'active' }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors[status] || colors.active}`}>{status.replaceAll('_', ' ')}</span>;
}
