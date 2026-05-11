import api from '../lib/axios';

export const REPORT_TYPES = [
  { value: 'dashboard_summary', label: 'Dashboard Summary' },
  { value: 'daily_tracker', label: 'Daily Tracker' },
  { value: 'task', label: 'Task Report' },
  { value: 'user_performance', label: 'User Performance' },
  { value: 'department', label: 'Department' },
  { value: 'project', label: 'Project' },
  { value: 'sla', label: 'SLA Performance' },
  { value: 'delay', label: 'Delay Report' },
  { value: 'pending_task', label: 'Pending Tasks' },
  { value: 'submitted_task', label: 'Submitted / Closed' },
  { value: 'budget', label: 'Budget' },
  { value: 'expense', label: 'Expense' },
  { value: 'monthly_management', label: 'Monthly Management' }
];

export const generateReportPreview = async (workspaceId, reportType, filters = {}) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/reports/generate`, {
    reportType,
    format: 'preview',
    filters
  });
  return data;
};

export const exportReport = async (workspaceId, reportType, format, filters = {}) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/reports/generate`, {
    reportType,
    format,
    filters
  });
  return data;
};

export const getReports = async (workspaceId) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/reports`);
  return data;
};

export const getTrackerReportData = (workspaceId, filters = {}) =>
  generateReportPreview(workspaceId, 'daily_tracker', filters);

export const exportTrackerReport = (workspaceId, format, filters = {}) =>
  exportReport(workspaceId, 'daily_tracker', format, filters);
