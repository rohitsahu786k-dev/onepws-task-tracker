const DashboardLayout = require('../models/DashboardLayout');
const DashboardWidget = require('../models/DashboardWidget');
const DashboardPreference = require('../models/DashboardPreference');
const dashboardWidgetService = require('./dashboardWidget.service');
const dashboardLayoutService = require('./dashboardLayout.service');
const dashboardPermissionService = require('./dashboardPermission.service');
const dashboardMetricService = require('./dashboardMetric.service');
const dashboardCache = require('./dashboardCache.service');

async function getLayout(req) {
  await dashboardWidgetService.ensureDefaultWidgets();
  const dashboardType = dashboardLayoutService.getDefaultDashboardType(req);
  let layout = await DashboardLayout.findOne({ workspace: req.workspace._id, user: req.user._id, dashboardType });
  if (!layout) {
    layout = await dashboardLayoutService.createDefaultLayout({ workspace: req.workspace._id, user: req.user, dashboardType });
  }
  const definitions = await DashboardWidget.find({ widgetKey: { $in: layout.widgets.map((w) => w.widgetKey) }, isActive: true }).lean();
  const widgets = layout.widgets
    .filter((layoutWidget) => layoutWidget.isVisible !== false)
    .map((layoutWidget) => ({ ...definitions.find((w) => w.widgetKey === layoutWidget.widgetKey), ...layoutWidget.toObject?.() || layoutWidget }))
    .filter((widget) => dashboardPermissionService.canViewWidget({ widget, req }));
  return { ...layout.toObject(), widgets };
}

async function updateLayout(req) {
  return DashboardLayout.findOneAndUpdate(
    { workspace: req.workspace._id, user: req.user._id, dashboardType: req.body.dashboardType || req.query.type || 'member' },
    { ...req.body, workspace: req.workspace._id, user: req.user._id, updatedBy: req.user._id },
    { new: true, upsert: true, runValidators: true }
  );
}

async function getWidgetData(req) {
  const widget = await DashboardWidget.findOne({ widgetKey: req.params.widgetKey, isActive: true }).lean();
  if (!dashboardPermissionService.canViewWidget({ widget, req })) {
    const error = new Error('You do not have access to this widget');
    error.statusCode = 403;
    throw error;
  }
  const resolver = dashboardMetricService[req.params.widgetKey];
  if (!resolver) {
    const error = new Error('Widget resolver not found');
    error.statusCode = 404;
    throw error;
  }
  const filterHash = JSON.stringify(req.query || {});
  const cacheKey = `dashboard:${req.workspace._id}:${req.user._id}:${req.params.widgetKey}:${filterHash}`;
  return dashboardCache.getCachedWidgetData(cacheKey, () => resolver({ workspace: req.workspace._id, user: req.user, req }, req.query), widget.refreshIntervalSeconds || 60);
}

async function getPreferences(req) {
  return DashboardPreference.findOneAndUpdate(
    { workspace: req.workspace._id, user: req.user._id },
    { $setOnInsert: { workspace: req.workspace._id, user: req.user._id } },
    { upsert: true, new: true }
  );
}

module.exports = { getLayout, updateLayout, getWidgetData, getPreferences };
