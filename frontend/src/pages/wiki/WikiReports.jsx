import React, { useEffect, useState } from 'react';
import wikiApi from '../../api/wiki.api';
import useAuthStore from '../../store/authStore';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace;

export default function WikiReports() {
  const workspaceId = getWorkspaceId(useAuthStore((state) => state.workspace));
  const [report, setReport] = useState(null);
  useEffect(() => {
    if (workspaceId) wikiApi.reports(workspaceId).then((res) => setReport(res.data));
  }, [workspaceId]);
  const cards = report ? Object.entries(report) : [];
  return (
    <main className="space-y-5 p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Wiki Reports</h1>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map(([label, value]) => <div key={label} className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs uppercase text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}
      </div>
    </main>
  );
}
