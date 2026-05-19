import React from 'react';

export default function EmployeeForm({ value, onChange, departments = [], designations = [], onSubmit, saving = false }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2">
      <input required value={value.firstName || ''} onChange={(event) => set('firstName', event.target.value)} placeholder="First name" className="h-10 rounded-md border border-slate-200 px-3 text-sm" />
      <input value={value.lastName || ''} onChange={(event) => set('lastName', event.target.value)} placeholder="Last name" className="h-10 rounded-md border border-slate-200 px-3 text-sm" />
      <input required type="email" value={value.email || ''} onChange={(event) => set('email', event.target.value)} placeholder="Email" className="h-10 rounded-md border border-slate-200 px-3 text-sm" />
      <input value={value.phone || ''} onChange={(event) => set('phone', event.target.value)} placeholder="Phone" className="h-10 rounded-md border border-slate-200 px-3 text-sm" />
      <select required value={value.department || ''} onChange={(event) => set('department', event.target.value)} className="h-10 rounded-md border border-slate-200 px-3 text-sm">
        <option value="">Department</option>
        {departments.map((dept) => <option key={dept._id} value={dept._id}>{dept.name}</option>)}
      </select>
      <select value={value.designation || ''} onChange={(event) => set('designation', event.target.value)} className="h-10 rounded-md border border-slate-200 px-3 text-sm">
        <option value="">Designation</option>
        {designations.map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}
      </select>
      <input value={value.jobTitle || ''} onChange={(event) => set('jobTitle', event.target.value)} placeholder="Job title" className="h-10 rounded-md border border-slate-200 px-3 text-sm" />
      <select value={value.workspaceRole || 'member'} onChange={(event) => set('workspaceRole', event.target.value)} className="h-10 rounded-md border border-slate-200 px-3 text-sm">
        {['owner', 'admin', 'manager', 'member', 'viewer', 'finance', 'approver', 'external'].map((role) => <option key={role} value={role}>{role}</option>)}
      </select>
      <textarea value={value.bio || ''} onChange={(event) => set('bio', event.target.value)} placeholder="Bio" rows={3} className="rounded-md border border-slate-200 px-3 py-2 text-sm md:col-span-2" />
      <div className="md:col-span-2"><button disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">{saving ? 'Saving...' : 'Save Employee'}</button></div>
    </form>
  );
}
