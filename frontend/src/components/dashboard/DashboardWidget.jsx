import MetricCard from './MetricCard';
import ListWidget from './ListWidget';
import ChartWidget from './ChartWidget';
import CalendarWidget from './CalendarWidget';
import AlertWidget from './AlertWidget';
import ActionWidget from './ActionWidget';
import WidgetCard from './WidgetCard';

function MultiMetricWidget({ data }) {
  return <WidgetCard title={data.title}><div className="grid grid-cols-2 gap-3">{data.metrics?.map((metric) => <div key={metric.label} className="rounded bg-slate-50 p-3"><p className="text-xs text-slate-500">{metric.label}</p><p className="text-lg font-semibold">{metric.value}</p></div>)}</div></WidgetCard>;
}

export default function DashboardWidget({ data }) {
  if (data.type === 'metric_card') return <MetricCard data={data} />;
  if (data.type === 'multi_metric') return <MultiMetricWidget data={data} />;
  if (data.type === 'list') return <ListWidget data={data} />;
  if (data.type === 'chart') return <ChartWidget data={data} />;
  if (data.type === 'calendar') return <CalendarWidget data={data} />;
  if (data.type === 'alert') return <AlertWidget data={data} />;
  if (data.type === 'action') return <ActionWidget data={data} />;
  if (data.type === 'timeline') return <ListWidget data={{ ...data, items: data.items?.map((item, index) => ({ id: index, title: item.action, subtitle: item.description, url: item.url })) }} />;
  return <WidgetCard title={data.title || 'Widget'}><pre className="text-xs">{JSON.stringify(data, null, 2)}</pre></WidgetCard>;
}
