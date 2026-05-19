const Task = require('../models/Task');
const ApprovalRequest = require('../models/ApprovalRequest');
const CalendarEvent = require('../models/CalendarEvent');
const Budget = require('../models/Budget');
const Campaign = require('../models/Campaign');
const ContentItem = require('../models/ContentItem');
const PrintJob = require('../models/PrintJob');
const ActivityLog = require('../models/ActivityLog');

const openTaskStatuses = { $nin: ['closed', 'cancelled'] };

async function getOpenTasksMetric(context) {
  const value = await Task.countDocuments({ workspace: context.workspace, status: openTaskStatuses, isDeleted: { $ne: true } });
  return { type: 'metric_card', label: 'Open Tasks', value, actionUrl: '/tasks?status=open' };
}

async function getOverdueTasksMetric(context) {
  const value = await Task.countDocuments({ workspace: context.workspace, dueDate: { $lt: new Date() }, status: openTaskStatuses, isDeleted: { $ne: true } });
  return { type: 'metric_card', label: 'Overdue Tasks', value, actionUrl: '/tasks?overdue=true' };
}

async function getMyTasksList(context) {
  const tasks = await Task.find({ workspace: context.workspace, assignedTo: context.user._id, status: openTaskStatuses, isDeleted: { $ne: true } }).sort({ dueDate: 1, priority: -1 }).limit(8);
  return {
    type: 'list',
    title: 'My Tasks',
    items: tasks.map((task) => ({ id: task._id, title: task.title, subtitle: task.dueDate ? `Due ${task.dueDate.toISOString().slice(0, 10)}` : 'No due date', status: task.status, priority: task.priority, url: `/tasks/${task._id}` })),
    emptyMessage: 'No open tasks.',
    viewAllUrl: '/tasks/my'
  };
}

async function getMyPendingApprovals(context) {
  const requests = await ApprovalRequest.find({ workspace: context.workspace, status: { $in: ['pending', 'in_progress'] }, 'steps.approvers.user': context.user._id, isDeleted: { $ne: true } }).sort({ priority: -1, submittedAt: 1 }).limit(8);
  return {
    type: 'list',
    title: 'My Pending Approvals',
    items: requests.map((request) => ({ id: request._id, title: request.title, subtitle: request.requestNumber || request.sourceModule, status: request.status, priority: request.priority, url: `/approvals/${request._id}` })),
    emptyMessage: 'No approvals pending.',
    viewAllUrl: '/approvals/my-pending'
  };
}

async function getTodayCalendar(context) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const events = await CalendarEvent.find({ workspace: context.workspace, startDate: { $gte: start, $lt: end } }).sort({ startDate: 1 }).limit(8);
  return { type: 'calendar', title: 'Today Calendar', events: events.map((event) => ({ id: event._id, title: event.title, time: event.startDate?.toLocaleTimeString?.('en-IN', { hour: '2-digit', minute: '2-digit' }), eventType: event.eventType, url: event.metadata?.sourceUrl || '/calendar' })), viewAllUrl: '/calendar' };
}

async function getBudgetOverview(context) {
  const budgets = await Budget.find({ workspace: context.workspace, isDeleted: { $ne: true } }).select('totalAmount spentAmount remainingAmount').lean();
  const total = budgets.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
  const used = budgets.reduce((sum, b) => sum + Number(b.spentAmount || 0), 0);
  return { type: 'multi_metric', title: 'Budget Overview', metrics: [{ label: 'Total Budget', value: total }, { label: 'Used', value: used }, { label: 'Remaining', value: total - used }, { label: 'Utilization', value: total ? `${Math.round((used / total) * 100)}%` : '0%' }] };
}

async function getCampaignPerformance(context) {
  const campaigns = await Campaign.find({ workspace: context.workspace, isDeleted: { $ne: true } }).select('performance status').lean();
  return { type: 'multi_metric', title: 'Campaign Performance', metrics: [{ label: 'Active', value: campaigns.filter((c) => c.status === 'active').length }, { label: 'Reach', value: campaigns.reduce((s, c) => s + Number(c.performance?.reach || 0), 0) }, { label: 'Leads', value: campaigns.reduce((s, c) => s + Number(c.performance?.leads || 0), 0) }, { label: 'Content', value: await ContentItem.countDocuments({ workspace: context.workspace, isDeleted: { $ne: true } }) }] };
}

async function getPrintJobStatus(context) {
  const [artworkPending, proofPending, inProduction, readyDispatch] = await Promise.all([
    PrintJob.countDocuments({ workspace: context.workspace, status: { $in: ['artwork_pending', 'artwork_review'] }, isDeleted: { $ne: true } }),
    PrintJob.countDocuments({ workspace: context.workspace, status: { $in: ['proof_pending', 'proof_review'] }, isDeleted: { $ne: true } }),
    PrintJob.countDocuments({ workspace: context.workspace, status: 'in_production', isDeleted: { $ne: true } }),
    PrintJob.countDocuments({ workspace: context.workspace, status: 'ready_for_dispatch', isDeleted: { $ne: true } })
  ]);
  return { type: 'multi_metric', title: 'Print Job Status', metrics: [{ label: 'Artwork Pending', value: artworkPending }, { label: 'Proof Pending', value: proofPending }, { label: 'In Production', value: inProduction }, { label: 'Ready Dispatch', value: readyDispatch }] };
}

async function getQuickActions() {
  return { type: 'action', title: 'Quick Actions', actions: [{ label: 'Create Task', icon: 'check-square', action: 'open_create_task', permission: 'tasks:create' }, { label: 'Create Campaign', icon: 'megaphone', action: 'open_create_campaign', permission: 'campaigns:create' }, { label: 'Create Print Job', icon: 'printer', action: 'open_create_print_job', permission: 'print_jobs:create' }] };
}

async function getRecentActivity(context) {
  const items = await ActivityLog.find({ workspace: context.workspace }).sort({ createdAt: -1 }).limit(8).lean().catch(() => []);
  return { type: 'timeline', title: 'Recent Activity', items: items.map((item) => ({ action: item.action, description: item.description || item.message, module: item.module, time: item.createdAt, url: item.refId ? `/${item.module || 'activity'}/${item.refId}` : '/activity-log' })) };
}

module.exports = {
  overview_open_tasks: getOpenTasksMetric,
  overview_overdue_tasks: getOverdueTasksMetric,
  my_tasks: getMyTasksList,
  my_pending_approvals: getMyPendingApprovals,
  today_calendar: getTodayCalendar,
  budget_overview: getBudgetOverview,
  campaign_performance: getCampaignPerformance,
  print_job_status: getPrintJobStatus,
  quick_actions: getQuickActions,
  recent_activity: getRecentActivity
};
