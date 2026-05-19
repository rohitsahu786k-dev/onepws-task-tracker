import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import wikiApi from '../../api/wiki.api';
import useAuthStore from '../../store/authStore';
import WikiEditor from '../../components/wiki/WikiEditor';
import WikiBreadcrumb from '../../components/wiki/WikiBreadcrumb';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

export default function CreateWikiArticle() {
  const navigate = useNavigate();
  const workspaceId = getWorkspaceId(useAuthStore((state) => state.workspace));
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [article, setArticle] = useState({ articleType: 'general', visibility: 'workspace', content: '' });

  useEffect(() => {
    if (workspaceId) wikiApi.categories(workspaceId).then((res) => setCategories(res.data || res.categories || []));
  }, [workspaceId]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const plainText = (article.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const res = await wikiApi.create(workspaceId, { ...article, plainText });
      navigate(`/wiki/${res.data?._id || res.article?._id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-4 p-6">
      <WikiBreadcrumb current="Create Article" />
      <h1 className="text-2xl font-semibold text-slate-900">Create Wiki Article</h1>
      <WikiEditor value={article} onChange={setArticle} categories={categories} onSubmit={submit} saving={saving} />
    </main>
  );
}
