import React from 'react';

export default function WikiVersionHistory({ versions = [], onRestore }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Version History</h3>
      <div className="mt-3 space-y-3">
        {versions.map((version) => (
          <div key={version._id} className="flex items-center justify-between rounded-md border border-slate-100 p-3">
            <div>
              <p className="text-sm font-medium">Version {version.versionNumber}</p>
              <p className="text-xs text-slate-500">{version.changeSummary || version.changeType} • {version.createdAt ? new Date(version.createdAt).toLocaleString() : ''}</p>
            </div>
            <button onClick={() => onRestore?.(version)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs">Restore</button>
          </div>
        ))}
        {!versions.length && <p className="text-sm text-slate-500">No versions saved yet.</p>}
      </div>
    </section>
  );
}
