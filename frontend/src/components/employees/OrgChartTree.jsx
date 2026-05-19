import React from 'react';

function Node({ node }) {
  return (
    <li className="ml-4 border-l border-slate-200 pl-4">
      <div className="rounded-md border border-slate-200 bg-white p-3">
        <p className="font-medium text-slate-900">{node.name}</p>
        <p className="text-xs text-slate-500">{node.designation || 'Employee'}</p>
      </div>
      {!!node.children?.length && <ul className="mt-3 space-y-3">{node.children.map((child) => <Node key={child.employee || child.user} node={child} />)}</ul>}
    </li>
  );
}

export default function OrgChartTree({ nodes = [] }) {
  return <ul className="space-y-3">{nodes.map((node) => <Node key={node.employee || node.user} node={node} />)}</ul>;
}
