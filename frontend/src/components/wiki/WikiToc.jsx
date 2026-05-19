import React from 'react';

export default function WikiToc({ items = [] }) {
  if (!items.length) return null;
  return (
    <aside className="sticky top-20 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Contents</h3>
      <ol className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <li key={`${item.id}-${item.order}`} className={item.level > 2 ? 'ml-4' : ''}>
            <a className="text-slate-600 hover:text-blue-700" href={`#${item.id}`}>{item.title}</a>
          </li>
        ))}
      </ol>
    </aside>
  );
}
