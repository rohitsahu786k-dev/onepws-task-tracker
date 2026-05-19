const DashboardWidget = require('../models/DashboardWidget');

const defaultWidgets = [
  { widgetKey: 'overview_open_tasks', title: 'Open Tasks', category: 'overview', widgetType: 'metric_card', moduleKey: 'tasks', allowedRoles: ['owner', 'admin', 'manager'], order: 1 },
  { widgetKey: 'overview_overdue_tasks', title: 'Overdue Tasks', category: 'alert', widgetType: 'metric_card', moduleKey: 'tasks', allowedRoles: ['owner', 'admin', 'manager'], order: 2 },
  { widgetKey: 'my_tasks', title: 'My Tasks', category: 'list', widgetType: 'list', moduleKey: 'tasks', order: 10, defaultSize: { w: 2, h: 2 } },
  { widgetKey: 'my_pending_approvals', title: 'My Pending Approvals', category: 'action', widgetType: 'list', moduleKey: 'approvals', order: 20, defaultSize: { w: 2, h: 2 } },
  { widgetKey: 'today_calendar', title: 'Today Calendar', category: 'calendar', widgetType: 'calendar', moduleKey: 'calendar', order: 30, defaultSize: { w: 2, h: 2 } },
  { widgetKey: 'budget_overview', title: 'Budget Overview', category: 'finance', widgetType: 'multi_metric', moduleKey: 'budget', allowedRoles: ['owner', 'admin', 'manager', 'finance'], order: 40 },
  { widgetKey: 'campaign_performance', title: 'Campaign Performance', category: 'performance', widgetType: 'multi_metric', moduleKey: 'campaigns', order: 50 },
  { widgetKey: 'print_job_status', title: 'Print Job Status', category: 'overview', widgetType: 'multi_metric', moduleKey: 'print_jobs', order: 60 },
  { widgetKey: 'quick_actions', title: 'Quick Actions', category: 'shortcut', widgetType: 'action', order: 90 },
  { widgetKey: 'recent_activity', title: 'Recent Activity', category: 'activity', widgetType: 'timeline', order: 100, defaultSize: { w: 2, h: 2 } }
];

async function ensureDefaultWidgets() {
  for (const widget of defaultWidgets) {
    await DashboardWidget.updateOne({ widgetKey: widget.widgetKey }, { $setOnInsert: widget }, { upsert: true });
  }
}

module.exports = { defaultWidgets, ensureDefaultWidgets };
