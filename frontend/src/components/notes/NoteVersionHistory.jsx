const NoteVersionHistory = ({ versions = [], onRestore }) => (
  <div className="space-y-2">
    {versions.map((version) => (
      <div key={version._id} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-sm">
        <span>Version {version.versionNumber}</span>
        <button type="button" onClick={() => onRestore?.(version)} className="font-medium text-slate-950">Restore</button>
      </div>
    ))}
  </div>
);

export default NoteVersionHistory;
