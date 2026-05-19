import React from 'react';

export default function EmployeeRoleBadge({ role = 'member' }) {
  return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">{role}</span>;
}
