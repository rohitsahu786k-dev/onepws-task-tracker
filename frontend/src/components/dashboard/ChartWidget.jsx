import WidgetCard from './WidgetCard';

export default function ChartWidget({ data }) {
  return <WidgetCard title={data.title}><div className="space-y-2">{data.data?.map((item) => <div key={item.label}><div className="flex justify-between text-xs"><span>{item.label}</span><span>{item.value}</span></div><div className="mt-1 h-2 rounded bg-slate-100"><div className="h-2 rounded bg-primary" style={{ width: `${Math.min(Number(item.value || 0), 100)}%` }} /></div></div>)}</div></WidgetCard>;
}
