import React from 'react';

export default function EmployeeFilterPanel({ filters, onChange, departments = [] }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <input value={filters.search || ''} onChange={(event) => set('search', event.target.value)} placeholder="Search employees..." className="h-10 rounded-md border border-slate-200 px-3 text-sm" />
      <select value={filters.department || ''} onChange={(event) => set('department', event.target.value)} className="h-10 rounded-md border border-slate-200 px-3 text-sm">
        <option value="">All departments</option>
        {departments.map((dept) => <option key={dept._id} value={dept._id}>{dept.name}</option>)}
      </select>
      <select value={filters.status || ''} onChange={(event) => set('status', event.target.value)} className="h-10 rounded-md border border-slate-200 px-3 text-sm">
        <option value="">All statuses</option>
        {['active', 'invited', 'pending', 'on_leave', 'inactive', 'suspended', 'terminated'].map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
      </select>
      <select value={filters.availability || ''} onChange={(event) => set('availability', event.target.value)} className="h-10 rounded-md border border-slate-200 px-3 text-sm">
        <option value="">All availability</option>
        {['available', 'busy', 'in_meeting', 'on_leave', 'offline', 'do_not_disturb'].map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
      </select>
    </div>
  );
}
