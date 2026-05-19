import React, { useEffect, useState } from 'react';
import wikiApi from '../../api/wiki.api';
import useAuthStore from '../../store/authStore';
import WikiArticleTable from '../../components/wiki/WikiArticleTable';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

export default function WikiApprovals() {
  const workspaceId = getWorkspaceId(useAuthStore((state) => state.workspace));
  const [articles, setArticles] = useState([]);
  useEffect(() => {
    if (workspaceId) wikiApi.list(workspaceId, { status: 'pending_review' }).then((res) => setArticles(res.data || res.articles || []));
  }, [workspaceId]);
  return <main className="space-y-4 p-6"><h1 className="text-2xl font-semibold">Pending Wiki Reviews</h1><WikiArticleTable articles={articles} /></main>;
}
