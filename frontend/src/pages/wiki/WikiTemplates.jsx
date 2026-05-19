import React, { useEffect, useState } from 'react';
import wikiApi from '../../api/wiki.api';
import useAuthStore from '../../store/authStore';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

export default function WikiTemplates() {
  const workspaceId = getWorkspaceId(useAuthStore((state) => state.workspace));
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({ name: '', articleType: 'sop', defaultTitle: '' });
  const load = () => workspaceId && wikiApi.templates(workspaceId).then((res) => setTemplates(res.data || res.templates || []));
  useEffect(() => { load(); }, [workspaceId]);
  const submit = async (event) => {
    event.preventDefault();
    await wikiApi.createTemplate(workspaceId, form);
    setForm({ name: '', articleType: 'sop', defaultTitle: '' });
    load();
  };
  return (
    <main className="space-y-5 p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Wiki Templates</h1>
      <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-4">
        <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Template name" className="h-10 rounded-md border border-slate-200 px-3 text-sm" />
        <input value={form.articleType} onChange={(event) => setForm({ ...form, articleType: event.target.value })} placeholder="Article type" className="h-10 rounded-md border border-slate-200 px-3 text-sm" />
        <input value={form.defaultTitle} onChange={(event) => setForm({ ...form, defaultTitle: event.target.value })} placeholder="Default title" className="h-10 rounded-md border border-slate-200 px-3 text-sm" />
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">Create Template</button>
      </form>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => <div key={template._id} className="rounded-lg border border-slate-200 bg-white p-4"><h2 className="font-semibold">{template.name}</h2><p className="text-sm text-slate-500">{template.articleType}</p></div>)}
      </div>
    </main>
  );
}
