import React, { useEffect, useState } from 'react';
import wikiApi from '../../api/wiki.api';
import useAuthStore from '../../store/authStore';
import WikiCategoryTree from '../../components/wiki/WikiCategoryTree';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

export default function WikiCategories() {
  const workspaceId = getWorkspaceId(useAuthStore((state) => state.workspace));
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', icon: 'book-open' });
  const load = () => workspaceId && wikiApi.categories(workspaceId).then((res) => setCategories(res.data || res.categories || []));
  useEffect(() => { load(); }, [workspaceId]);
  const submit = async (event) => {
    event.preventDefault();
    await wikiApi.createCategory(workspaceId, form);
    setForm({ name: '', icon: 'book-open' });
    load();
  };
  return (
    <main className="grid gap-6 p-6 lg:grid-cols-[320px_1fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-4"><h1 className="text-xl font-semibold">Wiki Categories</h1><div className="mt-4"><WikiCategoryTree categories={categories} /></div></section>
      <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">Create Category</h2>
        <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Category name" className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm" />
        <input value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} placeholder="Icon" className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm" />
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">Create</button>
      </form>
    </main>
  );
}
