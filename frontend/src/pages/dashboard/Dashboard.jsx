import { useEffect, useState } from 'react';
import dashboardApi from '../../api/dashboard.api';
import DashboardGrid from '../../components/dashboard/DashboardGrid';
import WidgetSkeleton from '../../components/dashboard/WidgetSkeleton';

const Dashboard = ({ type }) => {
  const [widgets, setWidgets] = useState(null);
  useEffect(() => {
    let alive = true;
    dashboardApi.layout(type ? { type } : {}).then(async (res) => {
      const layoutWidgets = res.data?.widgets || [];
      const resolved = await Promise.all(layoutWidgets.map(async (widget) => {
        try {
          const data = await dashboardApi.widgetData(widget.widgetKey);
          return { ...widget, data: data.data };
        } catch {
          return { ...widget, data: { type: 'metric_card', label: widget.title || widget.widgetKey, value: 0 } };
        }
      }));
      if (alive) setWidgets(resolved);
    }).catch(() => setWidgets([]));
    return () => { alive = false; };
  }, [type]);

  return (
    <main className="space-y-4 p-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Role-based overview, alerts, approvals and quick actions.</p>
      </header>
      {widgets ? <DashboardGrid widgets={widgets} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><WidgetSkeleton /><WidgetSkeleton /><WidgetSkeleton /><WidgetSkeleton /></div>}
    </main>
  );
};

export default Dashboard;
