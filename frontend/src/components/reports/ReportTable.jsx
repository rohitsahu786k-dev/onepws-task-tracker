const ReportTable = ({ rows = [] }) => {
  const columns = Object.keys(rows[0] || {}).filter((key) => !key.startsWith('_')).slice(0, 8);
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900">
          <tr>{columns.map((column) => <th key={column} className="px-4 py-3 text-left font-medium">{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row._id || index} className="border-t border-slate-100 dark:border-slate-800">
              {columns.map((column) => <td key={column} className="px-4 py-3">{String(row[column] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportTable;
