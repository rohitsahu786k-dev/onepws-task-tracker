const reportQueryService = require('./reportQuery.service');
const calc = require('./reportCalculation.service');
const charts = require('./reportChart.service');

async function buildReportPayload({ workspace, reportType, filters = {}, userContext = {} }) {
  if (reportType === 'daily_tracker' || reportType === 'tracker') {
    const rows = await reportQueryService.getTrackerReportData({ workspace, filters, userContext });
    return { rows, source: rows, summary: calc.calculateTrackerSummary(rows), chartData: charts.buildTrackerCharts(rows) };
  }

  if (['dashboard_summary', 'task', 'delay', 'pending_task', 'submitted_task'].includes(reportType)) {
    const taskFilters = { ...filters };
    if (reportType === 'delay') taskFilters.delayStatuses = ['delayed'];
    if (reportType === 'pending_task') taskFilters.statuses = ['open', 'in_process', 'review', 'hold'];
    if (reportType === 'submitted_task') taskFilters.statuses = ['closed'];
    const rows = await reportQueryService.getTaskReportData({ workspace, filters: taskFilters, userContext });
    return { rows, source: rows, summary: calc.calculateTaskSummary(rows), chartData: charts.buildTaskCharts(rows) };
  }

  if (reportType === 'user_performance') {
    const data = await reportQueryService.getUserPerformanceData({ workspace, filters, userContext });
    const rows = calc.calculateUserPerformance(data.tasks, data.timesheets);
    return { rows, source: rows, summary: { totalUsers: rows.length, totalTasks: data.tasks.length }, chartData: { tasksByUser: rows.map((row) => ({ name: row.userName, value: row.totalAssigned })) } };
  }

  if (reportType === 'department') {
    const { tasks, departments } = await reportQueryService.getDepartmentReportData({ workspace, filters, userContext });
    const rows = departments.map((department) => {
      const deptTasks = tasks.filter((task) => String(task.requestedByDepartment?._id || task.requestedByDepartment) === String(department._id));
      return { department: department.name, totalRequests: deptTasks.length, ...calc.calculateTaskSummary(deptTasks) };
    });
    return { rows, source: rows, summary: { totalDepartments: rows.length, totalTasks: tasks.length }, chartData: { departmentWiseRequests: rows.map((row) => ({ name: row.department, value: row.totalRequests })) } };
  }

  if (reportType === 'project') {
    const { tasks, projects } = await reportQueryService.getProjectReportData({ workspace, filters, userContext });
    const rows = projects.map((project) => {
      const projectTasks = tasks.filter((task) => String(task.project?._id || task.project) === String(project._id));
      return { projectName: project.title || project.name, projectCode: project.projectCode || project.code, status: project.status, totalTasks: projectTasks.length, ...calc.calculateTaskSummary(projectTasks) };
    });
    return { rows, source: rows, summary: { totalProjects: rows.length, totalTasks: tasks.length }, chartData: { projectWiseTasks: rows.map((row) => ({ name: row.projectName, value: row.totalTasks })) } };
  }

  if (reportType === 'sla') {
    const rows = await reportQueryService.getSlaReportData({ workspace, filters, userContext });
    return { rows, source: rows, summary: calc.calculateSlaSummary(rows), chartData: charts.buildSlaCharts(rows) };
  }

  if (reportType === 'budget' || reportType === 'expense') {
    const data = await reportQueryService.getBudgetReportData({ workspace, filters, userContext });
    const rows = reportType === 'budget' ? data.budgets : data.expenses;
    return { ...data, rows, source: rows, summary: calc.calculateBudgetSummary(data.budgets, data.expenses), chartData: charts.buildBudgetCharts(data.budgets, data.expenses) };
  }

  if (reportType === 'monthly_management') {
    const data = await reportQueryService.getMonthlyManagementData({ workspace, filters, userContext });
    return { ...data, rows: data.tasks, source: data.tasks, summary: calc.calculateMonthlyManagementSummary(data), chartData: { ...charts.buildTaskCharts(data.tasks), ...charts.buildSlaCharts(data.slas), ...charts.buildBudgetCharts(data.budgets, data.expenses) } };
  }

  const rows = await reportQueryService.getSimpleCollectionReportData({ workspace, filters, modelName: reportType });
  return { rows, source: rows, summary: { totalRecords: rows.length }, chartData: { recordsByStatus: charts.groupCount(rows, (row) => row.status) } };
}

module.exports = { buildReportPayload };
