import WidgetCard from './WidgetCard';

export default function ActionWidget({ data }) {
  return <WidgetCard title={data.title}><div className="grid gap-2 sm:grid-cols-2">{data.actions?.map((action) => <button key={action.action} type="button" className="rounded-md border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50">{action.label}</button>)}</div></WidgetCard>;
}
