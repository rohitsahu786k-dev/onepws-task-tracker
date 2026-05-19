export default function WidgetCard({ title, children, action }) {
  return <section className="rounded-md border border-slate-200 bg-white p-4"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-slate-900">{title}</h3>{action}</div>{children}</section>;
}
