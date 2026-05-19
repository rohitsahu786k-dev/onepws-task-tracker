import React from 'react';
import { Link } from 'react-router-dom';
import EmployeeRoleBadge from './EmployeeRoleBadge';
import EmployeeStatusBadge from './EmployeeStatusBadge';

export default function EmployeeTable({ employees = [] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
          <tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Availability</th><th className="px-4 py-3">Workload</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {employees.map((employee) => (
            <tr key={employee._id} className="hover:bg-slate-50">
              <td className="px-4 py-3"><Link to={`/employees/${employee._id}`} className="font-medium text-slate-900">{employee.displayName}</Link><p className="text-xs text-slate-500">{employee.employeeCode} • {employee.email}</p></td>
              <td className="px-4 py-3">{employee.department?.name || '-'}</td>
              <td className="px-4 py-3"><EmployeeRoleBadge role={employee.workspaceRole} /></td>
              <td className="px-4 py-3"><EmployeeStatusBadge status={employee.employmentStatus} /></td>
              <td className="px-4 py-3 capitalize">{employee.availabilityStatus?.replaceAll('_', ' ')}</td>
              <td className="px-4 py-3">{employee.workloadSummary?.workloadPercent || 0}%</td>
            </tr>
          ))}
          {!employees.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No employees found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
