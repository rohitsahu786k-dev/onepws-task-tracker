import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import wikiApi from '../../api/wiki.api';
import useAuthStore from '../../store/authStore';
import WikiEditor from '../../components/wiki/WikiEditor';
import WikiBreadcrumb from '../../components/wiki/WikiBreadcrumb';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

export default function EditWikiArticle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const workspaceId = getWorkspaceId(useAuthStore((state) => state.workspace));
  const [categories, setCategories] = useState([]);
  const [article, setArticle] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!workspaceId || !id) return;
    wikiApi.get(workspaceId, id).then((res) => setArticle(res.data || res.article));
    wikiApi.categories(workspaceId).then((res) => setCategories(res.data || res.categories || []));
  }, [workspaceId, id]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const plainText = (article.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      await wikiApi.update(workspaceId, id, { ...article, plainText, changeSummary: 'Article updated' });
      navigate(`/wiki/${id}`);
    } finally {
      setSaving(false);
    }
  };

  if (!article) return <main className="p-6 text-sm text-slate-500">Loading article...</main>;

  return (
    <main className="space-y-4 p-6">
      <WikiBreadcrumb current={article.title} />
      <h1 className="text-2xl font-semibold text-slate-900">Edit Wiki Article</h1>
      <WikiEditor value={{ ...article, category: article.category?._id || article.category }} onChange={setArticle} categories={categories} onSubmit={submit} saving={saving} />
    </main>
  );
}
