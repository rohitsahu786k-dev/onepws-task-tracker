import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import wikiApi from '../../api/wiki.api';
import useAuthStore from '../../store/authStore';
import WikiArticleTable from '../../components/wiki/WikiArticleTable';
import WikiSearchBar from '../../components/wiki/WikiSearchBar';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

export default function WikiArticleList() {
  const workspaceId = getWorkspaceId(useAuthStore((state) => state.workspace));
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!workspaceId) return;
    wikiApi.list(workspaceId, { search, status: status || undefined }).then((res) => setArticles(res.data || res.articles || []));
  }, [workspaceId, search, status]);

  return (
    <main className="space-y-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Wiki Articles</h1>
          <p className="text-sm text-slate-600">Search, filter, and manage knowledge articles.</p>
        </div>
        <Link className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white" to="/wiki/new">Create Article</Link>
      </header>
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <WikiSearchBar value={search} onChange={setSearch} />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-slate-200 px-3 text-sm">
          <option value="">All statuses</option>
          {['draft', 'pending_review', 'published', 'rejected', 'needs_update', 'archived', 'deprecated'].map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
        </select>
      </div>
      <WikiArticleTable articles={articles} />
    </main>
  );
}
