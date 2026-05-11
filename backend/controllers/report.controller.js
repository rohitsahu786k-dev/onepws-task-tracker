const fs = require('fs');
const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const Report = require('../models/Report');
const ReportExportLog = require('../models/ReportExportLog');
const ActivityLog = require('../models/ActivityLog');
const reportQueryService = require('../services/reportQuery.service');
const calc = require('../services/reportCalculation.service');
const charts = require('../services/reportChart.service');
const pdf = require('../services/reportPdf.service');
const excel = require('../services/reportExcel.service');
const csv = require('../services/reportCsv.service');
const reportEmailService = require('../services/reportEmail.service');
const generateReportNumber = require('../utils/reportNumberGenerator');

const REPORT_TITLES = {
  dashboard_summary: 'Dashboard Summary Report',
  daily_tracker: 'Daily Task Tracker Report',
  task: 'Task Report',
  user_performance: 'User Performance Report',
  department: 'Department-Wise Report',
  project: 'Project Report',
  sla: 'SLA Performance Report',
  delay: 'Delay Report',
  pending_task: 'Pending Task Report',
  submitted_task: 'Submitted / Closed Task Report',
  budget: 'Budget Report',
  expense: 'Expense Report',
  monthly_management: 'Monthly Management Report',
  meeting: 'Meeting Report',
  mom: 'MOM Report',
  timesheet: 'Timesheet Report',
  media: 'Media Library Report',
  intake: 'Intake Request Report',
  approval: 'Approval Report'
};

function userContext(req) {
  return { user: req.user, role: req.workspaceRole, department: req.workspaceDepartment };
}

function tableRowsFor(reportType, payload) {
  if (reportType === 'daily_tracker') return payload;
  if (['task', 'dashboard_summary', 'delay', 'pending_task', 'submitted_task'].includes(reportType)) return payload;
  if (reportType === 'sla') return payload;
  if (reportType === 'budget') return payload.budgets;
  if (reportType === 'expense') return payload.expenses;
  if (reportType === 'user_performance' || reportType === 'department' || reportType === 'project') return payload.rows;
  if (reportType === 'monthly_management') return payload.tasks;
  return payload;
}

async function buildReportPayload({ workspace, reportType, filters, userContext }) {
  if (reportType === 'daily_tracker') {
    const rows = await reportQueryService.getTrackerReportData({ workspace, filters, userContext });
    return { rows, summary: calc.calculateTrackerSummary(rows), chartData: charts.buildTrackerCharts(rows), source: rows };
  }

  if (['dashboard_summary', 'task', 'delay', 'pending_task', 'submitted_task'].includes(reportType)) {
    const taskFilters = { ...filters };
    if (reportType === 'delay') taskFilters.delayStatuses = ['delayed'];
    if (reportType === 'pending_task') taskFilters.statuses = ['open', 'in_process', 'review', 'hold'];
    if (reportType === 'submitted_task') taskFilters.statuses = ['closed'];
    const tasks = await reportQueryService.getTaskReportData({ workspace, filters: taskFilters, userContext });
    return { rows: tasks, summary: calc.calculateTaskSummary(tasks), chartData: charts.buildTaskCharts(tasks), source: tasks };
  }

  if (reportType === 'user_performance') {
    const data = await reportQueryService.getUserPerformanceData({ workspace, filters, userContext });
    const rows = calc.calculateUserPerformance(data.tasks, data.timesheets);
    return { rows, summary: { totalUsers: rows.length, totalTasks: data.tasks.length }, chartData: { tasksByUser: rows.map((row) => ({ name: row.userName, value: row.totalAssigned })) }, source: rows };
  }

  if (reportType === 'department') {
    const { tasks, departments } = await reportQueryService.getDepartmentReportData({ workspace, filters, userContext });
    const rows = departments.map((department) => {
      const deptTasks = tasks.filter((task) => String(task.requestedByDepartment?._id || task.requestedByDepartment) === String(department._id));
      const summary = calc.calculateTaskSummary(deptTasks);
      return { department: department.name, totalRequests: deptTasks.length, ...summary };
    });
    return { rows, summary: { totalDepartments: rows.length, totalTasks: tasks.length }, chartData: { departmentWiseRequests: rows.map((row) => ({ name: row.department, value: row.totalRequests })) }, source: rows };
  }

  if (reportType === 'project') {
    const { tasks, projects } = await reportQueryService.getProjectReportData({ workspace, filters, userContext });
    const rows = projects.map((project) => {
      const projectTasks = tasks.filter((task) => String(task.project?._id || task.project) === String(project._id));
      const summary = calc.calculateTaskSummary(projectTasks);
      return { projectName: project.title || project.name, projectCode: project.projectCode || project.code, status: project.status, totalTasks: projectTasks.length, budgetAllocated: project.budgetAllocated, ...summary };
    });
    return { rows, summary: { totalProjects: rows.length, totalTasks: tasks.length }, chartData: { projectWiseTasks: rows.map((row) => ({ name: row.projectName, value: row.totalTasks })) }, source: rows };
  }

  if (reportType === 'sla') {
    const slas = await reportQueryService.getSlaReportData({ workspace, filters, userContext });
    return { rows: slas, summary: calc.calculateSlaSummary(slas), chartData: charts.buildSlaCharts(slas), source: slas };
  }

  if (reportType === 'budget' || reportType === 'expense') {
    const data = await reportQueryService.getBudgetReportData({ workspace, filters, userContext });
    return { ...data, rows: reportType === 'budget' ? data.budgets : data.expenses, summary: calc.calculateBudgetSummary(data.budgets, data.expenses), chartData: charts.buildBudgetCharts(data.budgets, data.expenses), source: reportType === 'budget' ? data.budgets : data.expenses };
  }

  if (reportType === 'monthly_management') {
    const data = await reportQueryService.getMonthlyManagementData({ workspace, filters, userContext });
    return { ...data, rows: data.tasks, summary: calc.calculateMonthlyManagementSummary(data), chartData: { ...charts.buildTaskCharts(data.tasks), ...charts.buildSlaCharts(data.slas), ...charts.buildBudgetCharts(data.budgets, data.expenses) }, source: data.tasks };
  }

  const rows = await reportQueryService.getSimpleCollectionReportData({ workspace, filters, modelName: reportType });
  return { rows, summary: { totalRecords: rows.length }, chartData: { recordsByStatus: charts.groupCount(rows, (row) => row.status) }, source: rows };
}

const listReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ workspace: req.params.wid })
    .sort({ createdAt: -1 })
    .limit(Number(req.query.limit || 50))
    .populate('generatedBy', 'name email');
  res.json({ success: true, data: reports });
});

const getReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ _id: req.params.id, workspace: req.params.wid }).populate('generatedBy', 'name email');
  if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
  res.json({ success: true, data: report });
});

const deleteReport = asyncHandler(async (req, res) => {
  await Report.findOneAndDelete({ _id: req.params.id, workspace: req.params.wid });
  res.json({ success: true, message: 'Report deleted' });
});

const generateReport = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  const reportType = req.body.reportType || req.params.reportType || 'daily_tracker';
  const filters = req.body.filters || req.query || {};
  const format = req.body.format || 'preview';
  const title = req.body.title || REPORT_TITLES[reportType] || 'Custom Report';
  const payload = await buildReportPayload({ workspace: wid, reportType, filters, userContext: userContext(req) });

  if (format === 'preview') {
    return res.json({
      success: true,
      data: {
        reportType,
        title,
        summary: payload.summary,
        chartData: payload.chartData,
        rows: tableRowsFor(reportType, payload).slice(0, Number(req.body.limit || 200))
      }
    });
  }

  let file;
  if (format === 'pdf') file = await pdf.generatePDF({ reportType, title, data: payload.source, summary: payload.summary, chartData: payload.chartData, filters, generatedBy: req.user });
  else if (format === 'excel') file = await excel.generateExcel({ reportType, title, data: payload.source, summary: payload.summary, chartData: payload.chartData, filters });
  else if (format === 'csv') file = await csv.generateCSV({ reportType, data: payload.source, filters });
  else return res.status(400).json({ success: false, message: 'Invalid report format' });

  const report = await Report.create({
    workspace: wid,
    reportNumber: await generateReportNumber(wid),
    title,
    reportType,
    filters,
    summary: payload.summary,
    generatedFiles: {
      [`${format}Path`]: file.filePath,
      [`${format}Url`]: file.fileUrl
    },
    status: 'completed',
    generatedBy: req.user._id
  });

  const stats = fs.statSync(file.filePath);
  const log = await ReportExportLog.create({
    workspace: wid,
    report: report._id,
    reportType,
    exportFormat: format,
    filePath: file.filePath,
    fileUrl: file.fileUrl,
    fileSize: stats.size,
    exportedBy: req.user._id
  });

  await ActivityLog.create({
    workspace: wid,
    user: req.user._id,
    module: 'reports',
    action: 'report_exported',
    refModel: 'ReportExportLog',
    refId: log._id,
    description: `Exported ${title} as ${format.toUpperCase()}`
  });

  res.json({ success: true, message: `${format.toUpperCase()} report generated successfully`, data: { report, fileUrl: file.fileUrl, downloadUrl: `/api/workspaces/${wid}/reports/${report._id}/download/${format}` } });
});

const downloadReport = asyncHandler(async (req, res) => {
  const { wid, id, format } = req.params;
  const report = await Report.findOne({ _id: id, workspace: wid });
  if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
  const filePath = report.generatedFiles?.[`${format}Path`];
  if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'Report file not found' });
  res.download(path.resolve(filePath));
});

const emailReport = asyncHandler(async (req, res) => {
  const { wid, id } = req.params;
  const report = await Report.findOne({ _id: id, workspace: wid });
  if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

  const recipients = Array.isArray(req.body.recipients) ? req.body.recipients.filter(Boolean) : [];
  if (!recipients.length) return res.status(400).json({ success: false, message: 'At least one recipient is required' });

  await reportEmailService.sendReportEmail({
    workspace: wid,
    recipients,
    subject: req.body.subject || `ONEPWS Report: ${report.title}`,
    message: req.body.message,
    files: {
      pdf: req.body.attachPdf !== false ? report.generatedFiles?.pdfPath : null,
      excel: req.body.attachExcel ? report.generatedFiles?.excelPath : null,
      csv: req.body.attachCsv ? report.generatedFiles?.csvPath : null
    }
  });

  res.json({ success: true, message: 'Report email sent successfully' });
});

module.exports = {
  listReports,
  getReport,
  deleteReport,
  generateReport,
  generateTrackerReport: generateReport,
  downloadReport,
  emailReport
};
