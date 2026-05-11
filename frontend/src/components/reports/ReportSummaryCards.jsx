const ReportSummaryCards = ({ summary = {} }) => {
  const items = Object.entries(summary).slice(0, 8);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map(([key, value]) => (
        <article key={key} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-xs font-medium uppercase text-slate-500">{key}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{String(value ?? '')}</p>
        </article>
      ))}
    </div>
  );
};

export default ReportSummaryCards;
