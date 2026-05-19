import React from 'react';

function buildTree(categories) {
  const byId = new Map(categories.map((item) => [item._id, { ...item, children: [] }]));
  const roots = [];
  byId.forEach((node) => {
    const parentId = node.parentCategory;
    if (parentId && byId.has(parentId)) byId.get(parentId).children.push(node);
    else roots.push(node);
  });
  return roots.sort((a, b) => (a.order || 0) - (b.order || 0));
}

function Node({ item, onSelect, selected }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect?.(item)}
        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${selected === item._id ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
      >
        <span>{item.name}</span>
        <span className="text-xs text-slate-400">{item.articleCount || 0}</span>
      </button>
      {!!item.children?.length && (
        <ul className="ml-3 border-l border-slate-100 pl-2">
          {item.children.map((child) => <Node key={child._id} item={child} onSelect={onSelect} selected={selected} />)}
        </ul>
      )}
    </li>
  );
}

export default function WikiCategoryTree({ categories = [], onSelect, selected }) {
  return (
    <ul className="space-y-1">
      {buildTree(categories).map((item) => <Node key={item._id} item={item} onSelect={onSelect} selected={selected} />)}
    </ul>
  );
}
