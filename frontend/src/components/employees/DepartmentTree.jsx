import React from 'react';

export default function DepartmentTree({ departments = [] }) {
  return <div className="space-y-2">{departments.map((dept) => <div key={dept._id} className="rounded-md border border-slate-100 p-3"><p className="font-medium">{dept.name}</p><p className="text-xs text-slate-500">{dept.code} • {dept.members?.length || 0} members</p></div>)}</div>;
}
