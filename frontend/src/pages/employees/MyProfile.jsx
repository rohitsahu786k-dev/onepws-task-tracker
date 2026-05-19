import React, { useEffect, useState } from 'react';
import employeeApi from '../../api/employee.api';
import useAuthStore from '../../store/authStore';
import EmployeeProfileHeader from '../../components/employees/EmployeeProfileHeader';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

export default function MyProfile() {
  const workspaceId = getWorkspaceId(useAuthStore((state) => state.workspace));
  const [employee, setEmployee] = useState(null);
  useEffect(() => { if (workspaceId) employeeApi.me(workspaceId).then((res) => setEmployee(res.data || res.employee)); }, [workspaceId]);
  if (!employee) return <main className="p-6">Loading profile...</main>;
  return <main className="space-y-4 p-6"><EmployeeProfileHeader employee={employee} /><textarea value={employee.bio || ''} onChange={(event) => setEmployee({ ...employee, bio: event.target.value })} className="w-full rounded-md border border-slate-200 p-3 text-sm" rows={4} /><button onClick={() => employeeApi.updateMe(workspaceId, employee)} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">Save My Profile</button></main>;
}
