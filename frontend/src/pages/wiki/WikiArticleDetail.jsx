import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import wikiApi from '../../api/wiki.api';
import useAuthStore from '../../store/authStore';
import WikiApprovalPanel from '../../components/wiki/WikiApprovalPanel';
import WikiAttachmentList from '../../components/wiki/WikiAttachmentList';
import WikiBreadcrumb from '../../components/wiki/WikiBreadcrumb';
import WikiCommentBox from '../../components/wiki/WikiCommentBox';
import WikiFeedbackPanel from '../../components/wiki/WikiFeedbackPanel';
import WikiRelatedArticles from '../../components/wiki/WikiRelatedArticles';
import WikiStatusBadge from '../../components/wiki/WikiStatusBadge';
import WikiToc from '../../components/wiki/WikiToc';
import WikiVersionHistory from '../../components/wiki/WikiVersionHistory';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

export default function WikiArticleDetail() {
  const { id } = useParams();
  const workspaceId = getWorkspaceId(useAuthStore((state) => state.workspace));
  const [article, setArticle] = useState(null);
  const [versions, setVersions] = useState([]);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);

  const load = useCallback(async () => {
    if (!workspaceId || !id) return;
    const [articleRes, versionsRes, commentsRes, activityRes] = await Promise.all([
      wikiApi.get(workspaceId, id),
      wikiApi.versions(workspaceId, id),
      wikiApi.comments(workspaceId, id),
      wikiApi.activity(workspaceId, id),
    ]);
    setArticle(articleRes.data || articleRes.article);
    setVersions(versionsRes.data || versionsRes.versions || []);
    setComments(commentsRes.data || commentsRes.comments || []);
    setActivity(activityRes.data || activityRes.activity || []);
  }, [workspaceId, id]);

  useEffect(() => { load(); }, [load]);

  const run = async (fn) => {
    await fn();
    await load();
  };

  if (!article) return <main className="p-6 text-sm text-slate-500">Loading article...</main>;

  return (
    <main className="space-y-5 p-6">
      <WikiBreadcrumb current={article.title} />
      <header className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{article.articleNumber}</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">{article.title}</h1>
            {article.summary && <p className="mt-2 max-w-3xl text-sm text-slate-600">{article.summary}</p>}
          </div>
          <div className="flex items-center gap-2">
            <WikiStatusBadge status={article.status} />
            <Link to={`/wiki/${article._id}/edit`} className="rounded-md border border-slate-200 px-3 py-2 text-sm">Edit</Link>
          </div>
        </div>
        <dl className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-4">
          <div><dt className="font-medium text-slate-900">Type</dt><dd>{article.articleType?.replaceAll('_', ' ')}</dd></div>
          <div><dt className="font-medium text-slate-900">Category</dt><dd>{article.category?.name || '-'}</dd></div>
          <div><dt className="font-medium text-slate-900">Version</dt><dd>{article.version || 1}</dd></div>
          <div><dt className="font-medium text-slate-900">Next Review</dt><dd>{article.nextReviewDate ? new Date(article.nextReviewDate).toLocaleDateString() : '-'}</dd></div>
        </dl>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <article className="prose max-w-none rounded-lg border border-slate-200 bg-white p-6" dangerouslySetInnerHTML={{ __html: article.content || '' }} />
          <WikiAttachmentList attachments={article.attachments || []} />
          <WikiRelatedArticles articles={article.relatedArticles || []} />
          <WikiCommentBox comments={comments} onAdd={(payload) => run(() => wikiApi.addComment(workspaceId, id, payload))} />
          <WikiFeedbackPanel article={article} onFeedback={(payload) => run(() => wikiApi.feedback(workspaceId, id, payload))} />
        </div>
        <aside className="space-y-5">
          <WikiToc items={article.tableOfContents || []} />
          <WikiApprovalPanel
            article={article}
            onSubmitReview={() => run(() => wikiApi.submitReview(workspaceId, id))}
            onApprove={(payload) => run(() => wikiApi.approve(workspaceId, id, payload))}
            onReject={(payload) => run(() => wikiApi.reject(workspaceId, id, payload))}
            onPublish={() => run(() => wikiApi.status(workspaceId, id, 'publish'))}
          />
          <WikiVersionHistory versions={versions} onRestore={(version) => run(() => wikiApi.restoreVersion(workspaceId, id, version._id))} />
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Activity</h3>
            <div className="mt-3 space-y-2">
              {activity.slice(0, 8).map((item) => <p key={item._id} className="text-xs text-slate-500">{item.message || item.action}</p>)}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
