import DashboardWidget from './DashboardWidget';

export default function DashboardGrid({ widgets = [] }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{widgets.map((widget) => <DashboardWidget key={widget.widgetKey || widget.title} data={widget.data || widget} />)}</div>;
}
