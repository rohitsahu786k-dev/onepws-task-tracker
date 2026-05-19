export default function ContentPerformanceForm({ value = {}, onChange, onSubmit }) {
  const fields = ['impressions', 'reach', 'likes', 'comments', 'shares', 'clicks', 'leads', 'conversions', 'spend'];
  return <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }} className="grid gap-3 sm:grid-cols-3">{fields.map((field) => <label key={field} className="text-sm"><span className="capitalize text-slate-600">{field}</span><input type="number" min="0" className="mt-1 w-full rounded-md border px-3 py-2" value={value[field] || ''} onChange={(e) => onChange?.({ ...value, [field]: Number(e.target.value) })} /></label>)}<button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white sm:col-span-3">Save Performance</button></form>;
}
