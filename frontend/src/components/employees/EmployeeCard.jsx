import React from 'react';
import { Link } from 'react-router-dom';
import EmployeeRoleBadge from './EmployeeRoleBadge';
import EmployeeSkillTags from './EmployeeSkillTags';
import EmployeeStatusBadge from './EmployeeStatusBadge';
import EmployeeWorkloadSummary from './EmployeeWorkloadSummary';

export default function EmployeeCard({ employee }) {
  return (
    <Link to={`/employees/${employee._id}`} className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">{employee.displayName?.slice(0, 1) || 'E'}</div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900">{employee.displayName}</h3>
          <p className="truncate text-sm text-slate-500">{employee.jobTitle || employee.designation?.title || 'Employee'}</p>
          <p className="text-xs text-slate-400">{employee.department?.name || 'No department'}</p>
        </div>
        <EmployeeStatusBadge status={employee.employmentStatus} />
      </div>
      <div className="mt-3 flex gap-2"><EmployeeRoleBadge role={employee.workspaceRole} /><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-700">{employee.availabilityStatus}</span></div>
      <div className="mt-3"><EmployeeSkillTags skills={employee.skills || []} /></div>
      <div className="mt-3"><EmployeeWorkloadSummary workload={employee.workloadSummary || {}} /></div>
    </Link>
  );
}
