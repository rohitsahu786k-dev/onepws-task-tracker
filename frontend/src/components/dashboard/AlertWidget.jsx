import WidgetCard from './WidgetCard';

export default function AlertWidget({ data }) {
  return <WidgetCard title={data.title}><div className="space-y-2">{data.items?.map((item) => <a key={item.title} href={item.url} className="block rounded border border-amber-200 bg-amber-50 p-2 text-sm text-amber-900">{item.title}<span className="block text-xs">{item.message}</span></a>)}</div></WidgetCard>;
}
