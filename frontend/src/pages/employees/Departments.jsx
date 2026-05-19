import React, { useEffect, useState } from 'react';
import departmentApi from '../../api/department.api';
import useAuthStore from '../../store/authStore';
import DepartmentTree from '../../components/employees/DepartmentTree';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

export default function Departments() {
  const workspaceId = getWorkspaceId(useAuthStore((state) => state.workspace));
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ name: '', code: '' });
  const load = () => workspaceId && departmentApi.list(workspaceId).then((res) => setDepartments(res.data || res.departments || []));
  useEffect(() => { load(); }, [workspaceId]);
  const submit = async (event) => {
    event.preventDefault();
    await departmentApi.create(workspaceId, form);
    setForm({ name: '', code: '' });
    load();
  };
  return <main className="grid gap-5 p-6 lg:grid-cols-[320px_1fr]"><section className="rounded-lg border border-slate-200 bg-white p-4"><h1 className="text-xl font-semibold">Departments</h1><div className="mt-4"><DepartmentTree departments={departments} /></div></section><form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"><h2 className="font-semibold">Create Department</h2><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm" /><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Code" className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm" /><button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">Create</button></form></main>;
}
