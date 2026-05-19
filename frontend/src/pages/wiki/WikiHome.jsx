import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import wikiApi from '../../api/wiki.api';
import useAuthStore from '../../store/authStore';
import WikiArticleCard from '../../components/wiki/WikiArticleCard';
import WikiCategoryTree from '../../components/wiki/WikiCategoryTree';
import WikiSearchBar from '../../components/wiki/WikiSearchBar';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

export default function WikiHome() {
  const workspaceId = getWorkspaceId(useAuthStore((state) => state.workspace));
  const [home, setHome] = useState(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!workspaceId) return;
    wikiApi.home(workspaceId).then((res) => setHome(res.data)).catch(() => setHome({}));
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    const timer = setTimeout(() => {
      if (!search.trim()) return setResults([]);
      wikiApi.list(workspaceId, { search }).then((res) => setResults(res.data || res.articles || []));
    }, 250);
    return () => clearTimeout(timer);
  }, [search, workspaceId]);

  const featured = useMemo(() => [...(home?.featured || []), ...(home?.pinned || [])].slice(0, 6), [home]);

  return (
    <main className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Wiki / Knowledge Base</h1>
          <p className="mt-1 text-sm text-slate-600">SOPs, policies, templates, and approved team knowledge.</p>
        </div>
        <Link to="/wiki/new" className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" />Create Article</Link>
      </header>

      <WikiSearchBar value={search} onChange={setSearch} />
      {!!results.length && (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {results.map((article) => <WikiArticleCard key={article._id} article={article} />)}
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Categories</h2>
          <div className="mt-3"><WikiCategoryTree categories={home?.categories || []} /></div>
        </div>
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Featured & Pinned</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {featured.map((article) => <WikiArticleCard key={article._id} article={article} />)}
              {!featured.length && <p className="text-sm text-slate-500">No featured articles yet.</p>}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Recently Updated</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(home?.recent || []).map((article) => <WikiArticleCard key={article._id} article={article} />)}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
