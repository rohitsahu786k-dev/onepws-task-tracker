import React from 'react';
import { Link } from 'react-router-dom';
import WikiStatusBadge from './WikiStatusBadge';

export default function WikiArticleTable({ articles = [] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Article</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {articles.map((article) => (
            <tr key={article._id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <Link to={`/wiki/${article._id}`} className="font-medium text-slate-900 hover:text-blue-700">{article.title}</Link>
                <p className="text-xs text-slate-500">{article.articleNumber}</p>
              </td>
              <td className="px-4 py-3 capitalize text-slate-600">{article.articleType?.replaceAll('_', ' ')}</td>
              <td className="px-4 py-3 text-slate-600">{article.category?.name || '-'}</td>
              <td className="px-4 py-3"><WikiStatusBadge status={article.status} /></td>
              <td className="px-4 py-3 text-slate-500">{article.updatedAt ? new Date(article.updatedAt).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
          {!articles.length && (
            <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={5}>No wiki articles found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
