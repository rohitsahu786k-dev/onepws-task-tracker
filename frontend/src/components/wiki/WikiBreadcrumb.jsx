import React from 'react';
import { Link } from 'react-router-dom';

export default function WikiBreadcrumb({ current }) {
  return (
    <nav className="text-sm text-slate-500">
      <Link to="/dashboard" className="hover:text-slate-900">Dashboard</Link>
      <span className="mx-2">/</span>
      <Link to="/wiki" className="hover:text-slate-900">Wiki</Link>
      {current && <><span className="mx-2">/</span><span className="text-slate-700">{current}</span></>}
    </nav>
  );
}
