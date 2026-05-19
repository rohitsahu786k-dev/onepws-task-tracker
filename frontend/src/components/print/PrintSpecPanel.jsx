export default function PrintSpecPanel({ specifications = {} }) {
  return <div className="rounded-md border bg-white p-4"><p className="font-medium">Specifications</p><dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{Object.entries(specifications || {}).map(([key, value]) => <div key={key}><dt className="text-slate-500">{key}</dt><dd>{Array.isArray(value) ? value.join(', ') : String(value || '-')}</dd></div>)}</dl></div>;
}
