import React, { useEffect, useState } from 'react';
import employeeApi from '../../api/employee.api';
import useAuthStore from '../../store/authStore';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

export default function EmployeeReports() {
  const workspaceId = getWorkspaceId(useAuthStore((state) => state.workspace));
  const [report, setReport] = useState(null);
  useEffect(() => { if (workspaceId) employeeApi.reports(workspaceId).then((res) => setReport(res.data)); }, [workspaceId]);
  const cards = report ? [['Total', report.total], ['Active', report.active], ['Invited', report.invited], ['Inactive', report.inactive], ['On Leave', report.onLeave]] : [];
  return <main className="space-y-5 p-6"><h1 className="text-2xl font-semibold">Employee Reports</h1><div className="grid gap-3 md:grid-cols-5">{cards.map(([label, value]) => <div key={label} className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs uppercase text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}</div></main>;
}
