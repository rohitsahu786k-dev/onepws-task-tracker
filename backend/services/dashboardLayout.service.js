const DashboardLayout = require('../models/DashboardLayout');
const { defaultWidgets } = require('./dashboardWidget.service');

const defaultLayouts = {
  admin: ['overview_open_tasks', 'overview_overdue_tasks', 'my_pending_approvals', 'budget_overview', 'campaign_performance', 'print_job_status', 'today_calendar', 'recent_activity', 'quick_actions'],
  manager: ['overview_open_tasks', 'overview_overdue_tasks', 'my_pending_approvals', 'campaign_performance', 'print_job_status', 'today_calendar', 'recent_activity', 'quick_actions'],
  member: ['my_tasks', 'my_pending_approvals', 'today_calendar', 'quick_actions', 'recent_activity'],
  finance: ['budget_overview', 'my_pending_approvals', 'recent_activity', 'quick_actions'],
  print: ['print_job_status', 'today_calendar', 'recent_activity', 'quick_actions'],
  approver: ['my_pending_approvals', 'recent_activity', 'quick_actions']
};

function getDefaultDashboardType(req) {
  if (req.query.type) return req.query.type;
  if (['owner', 'admin', 'super_admin'].includes(req.workspaceRole)) return 'admin';
  return req.workspaceRole || 'member';
}

async function createDefaultLayout({ workspace, user, dashboardType }) {
  const keys = defaultLayouts[dashboardType] || defaultLayouts.member;
  const widgets = keys.map((widgetKey, index) => {
    const def = defaultWidgets.find((w) => w.widgetKey === widgetKey);
    return {
      widgetKey,
      position: { x: index % 4, y: Math.floor(index / 4), w: def?.defaultSize?.w || 1, h: def?.defaultSize?.h || 1 },
      config: def?.defaultConfig || {},
      isVisible: true,
      order: index
    };
  });
  return DashboardLayout.create({ workspace, user: user._id, dashboardType, widgets, createdBy: user._id });
}

module.exports = { defaultLayouts, getDefaultDashboardType, createDefaultLayout };
