import React from 'react';
import EmployeeRoleBadge from './EmployeeRoleBadge';
import EmployeeStatusBadge from './EmployeeStatusBadge';

export default function EmployeeProfileHeader({ employee }) {
  return (
    <header className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-semibold text-blue-700">{employee.displayName?.slice(0, 1) || 'E'}</div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-slate-900">{employee.displayName}</h1>
          <p className="text-sm text-slate-600">{employee.jobTitle || employee.designation?.title} • {employee.department?.name || 'No department'}</p>
          <p className="mt-1 text-sm text-slate-500">{employee.email} {employee.phone ? `• ${employee.phone}` : ''}</p>
          <div className="mt-3 flex gap-2"><EmployeeStatusBadge status={employee.employmentStatus} /><EmployeeRoleBadge role={employee.workspaceRole} /><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-700">{employee.availabilityStatus}</span></div>
        </div>
      </div>
    </header>
  );
}
