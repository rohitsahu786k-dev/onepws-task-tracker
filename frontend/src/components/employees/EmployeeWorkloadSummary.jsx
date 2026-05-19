import React from 'react';

export default function EmployeeWorkloadSummary({ workload = {} }) {
  const percent = workload.workloadPercent || 0;
  return (
    <div className="space-y-2">
      <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.min(percent, 100)}%` }} /></div>
      <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
        <span>{workload.openTasks || 0} open</span>
        <span>{workload.overdueTasks || 0} overdue</span>
        <span>{percent}% load</span>
      </div>
    </div>
  );
}
