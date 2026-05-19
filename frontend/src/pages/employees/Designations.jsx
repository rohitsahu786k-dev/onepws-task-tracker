import React, { useEffect, useState } from 'react';
import designationApi from '../../api/designation.api';
import useAuthStore from '../../store/authStore';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

export default function Designations() {
  const workspaceId = getWorkspaceId(useAuthStore((state) => state.workspace));
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', code: '', roleCategory: 'other' });
  const load = () => workspaceId && designationApi.list(workspaceId).then((res) => setItems(res.data || res.designations || []));
  useEffect(() => { load(); }, [workspaceId]);
  const submit = async (event) => {
    event.preventDefault();
    await designationApi.create(workspaceId, form);
    setForm({ title: '', code: '', roleCategory: 'other' });
    load();
  };
  return <main className="space-y-5 p-6"><h1 className="text-2xl font-semibold">Designations</h1><form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-4"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="h-10 rounded-md border border-slate-200 px-3 text-sm" /><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Code" className="h-10 rounded-md border border-slate-200 px-3 text-sm" /><input value={form.roleCategory} onChange={(e) => setForm({ ...form, roleCategory: e.target.value })} placeholder="Role category" className="h-10 rounded-md border border-slate-200 px-3 text-sm" /><button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">Create</button></form><div className="grid gap-3 md:grid-cols-3">{items.map((item) => <div key={item._id} className="rounded-lg border border-slate-200 bg-white p-4"><h2 className="font-semibold">{item.title}</h2><p className="text-sm text-slate-500">{item.code} • {item.roleCategory}</p></div>)}</div></main>;
}
