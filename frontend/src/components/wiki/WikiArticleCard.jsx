import React from 'react';
import { Link } from 'react-router-dom';
import WikiStatusBadge from './WikiStatusBadge';

export default function WikiArticleCard({ article }) {
  return (
    <Link to={`/wiki/${article._id}`} className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{article.articleNumber}</p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{article.title}</h3>
        </div>
        <WikiStatusBadge status={article.status} />
      </div>
      {article.summary && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{article.summary}</p>}
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        <span>{article.articleType?.replaceAll('_', ' ') || 'general'}</span>
        {article.category?.name && <span>{article.category.name}</span>}
        <span>v{article.version || 1}</span>
      </div>
    </Link>
  );
}
