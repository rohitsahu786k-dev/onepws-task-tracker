export default function CampaignPerformancePanel({ performance = {} }) {
  const metrics = ['impressions', 'reach', 'engagement', 'clicks', 'leads', 'conversions'];
  return <div className="grid gap-3 sm:grid-cols-3">{metrics.map((m) => <div key={m} className="rounded-md border bg-white p-3"><p className="text-xs uppercase text-slate-500">{m}</p><p className="text-xl font-semibold">{performance[m] || 0}</p></div>)}</div>;
}
