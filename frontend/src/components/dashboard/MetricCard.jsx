import WidgetCard from './WidgetCard';

export default function MetricCard({ data }) {
  return <WidgetCard title={data.label || data.title}><p className="text-3xl font-semibold text-slate-900">{data.value ?? 0}</p>{data.trend && <p className="mt-1 text-xs text-slate-500">{data.trend.value} {data.trend.label}</p>}</WidgetCard>;
}
