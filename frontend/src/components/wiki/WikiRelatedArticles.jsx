import React from 'react';
import { Link } from 'react-router-dom';

export default function WikiRelatedArticles({ articles = [] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Related Articles</h3>
      <div className="mt-3 space-y-2">
        {articles.map((article) => <Link key={article._id} to={`/wiki/${article._id}`} className="block text-sm text-blue-700 hover:underline">{article.title}</Link>)}
        {!articles.length && <p className="text-sm text-slate-500">No related articles.</p>}
      </div>
    </section>
  );
}
