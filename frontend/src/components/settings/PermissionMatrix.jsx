const PermissionMatrix = ({ rows = [] }) => (
  <div className="overflow-hidden rounded border border-slate-200">
    {rows.map((row) => <div key={row.key || row.label} className="border-b border-slate-100 px-3 py-2 text-sm last:border-b-0">{row.label || row.key}</div>)}
  </div>
);

export default PermissionMatrix;
