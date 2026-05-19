import WidgetCard from './WidgetCard';

export default function ListWidget({ data }) {
  return <WidgetCard title={data.title}>{data.items?.length ? <div className="space-y-2">{data.items.map((item) => <a key={item.id} href={item.url} className="block rounded border border-slate-100 p-2 text-sm hover:bg-slate-50"><span className="font-medium text-slate-800">{item.title}</span><span className="block text-xs text-slate-500">{item.subtitle}</span></a>)}</div> : <p className="text-sm text-slate-500">{data.emptyMessage || 'No records.'}</p>}</WidgetCard>;
}
