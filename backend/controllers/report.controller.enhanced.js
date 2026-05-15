/**
 * report.controller.enhanced.js - Complete Export Logic
 * Handles: Excel, PDF, CSV, Email exports with filters
 */

const asyncHandler = require('../utils/asyncHandler');
const Task = require('../models/Task');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const reportExcelService = require('../services/reportExcel.service');
const reportPdfService = require('../services/reportPdf.service');
const reportCsvService = require('../services/reportCsv.service');
const reportEmailService = require('../services/reportEmail.service');

/**
 * EXPORT TASKS AS EXCEL
 * POST /api/workspaces/:wid/reports/export/tasks/excel
 * 
 * Body: { filters: { projectId, stageId, priority, dateFrom, dateTo } }
 */
const exportTasksExcel = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  const { projectId, stageId, priority, assignedTo, dateFrom, dateTo } = req.body;

  // 1. BUILD FILTER
  const filter = { workspace: wid };
  
  if (projectId) filter.project = projectId;
  if (stageId) filter.stage = stageId;
  if (priority) filter.priority = priority;
  if (assignedTo && Array.isArray(assignedTo)) {
    filter.assignedTo = { $in: assignedTo };
  }
  if (dateFrom || dateTo) {
    filter.dueDate = {};
    if (dateFrom) filter.dueDate.$gte = new Date(dateFrom);
    if (dateTo) filter.dueDate.$lte = new Date(dateTo);
  }

  // 2. FETCH TASKS with population
  const tasks = await Task.find(filter)
    .populate('project', 'title')
    .populate('stage', 'name color')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .lean();

  if (tasks.length === 0) {
    throw new ApiError(400, 'No tasks found for the given filters');
  }

  // 3. GENERATE EXCEL with reportExcelService
  const excelBuffer = await reportExcelService.generateTasksExcel(tasks, {
    filterSummary: {
      totalTasks: tasks.length,
      overdueTasks: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length,
      completedTasks: tasks.filter(t => t.status === 'closed').length
    },
    generatedBy: req.user.name,
    generatedAt: new Date()
  });

  // 4. SET RESPONSE HEADERS for download
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Tasks_Report_${new Date().getTime()}.xlsx"`
  );

  return res.send(excelBuffer);
});

/**
 * EXPORT TASKS AS PDF
 * POST /api/workspaces/:wid/reports/export/tasks/pdf
 */
const exportTasksPDF = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  const { projectId, stageId, priority, assignedTo, dateFrom, dateTo } = req.body;

  // Build filter (same logic as Excel)
  const filter = { workspace: wid };
  if (projectId) filter.project = projectId;
  if (stageId) filter.stage = stageId;
  if (priority) filter.priority = priority;
  if (assignedTo && Array.isArray(assignedTo)) {
    filter.assignedTo = { $in: assignedTo };
  }
  if (dateFrom || dateTo) {
    filter.dueDate = {};
    if (dateFrom) filter.dueDate.$gte = new Date(dateFrom);
    if (dateTo) filter.dueDate.$lte = new Date(dateTo);
  }

  // Fetch tasks
  const tasks = await Task.find(filter)
    .populate('project', 'title')
    .populate('stage', 'name')
    .populate('assignedTo', 'name')
    .sort({ createdAt: -1 })
    .lean();

  if (tasks.length === 0) {
    throw new ApiError(400, 'No tasks found for the given filters');
  }

  // Generate PDF
  const pdfBuffer = await reportPdfService.generateTasksPDF(tasks, {
    title: 'Tasks Report',
    generatedBy: req.user.name,
    workspace: wid
  });

  // Response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Tasks_Report_${new Date().getTime()}.pdf"`
  );

  return res.send(pdfBuffer);
});

/**
 * EXPORT TASKS AS CSV
 * POST /api/workspaces/:wid/reports/export/tasks/csv
 */
const exportTasksCSV = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  const { projectId, stageId, priority, assignedTo, dateFrom, dateTo } = req.body;

  const filter = { workspace: wid };
  if (projectId) filter.project = projectId;
  if (stageId) filter.stage = stageId;
  if (priority) filter.priority = priority;
  if (assignedTo && Array.isArray(assignedTo)) {
    filter.assignedTo = { $in: assignedTo };
  }
  if (dateFrom || dateTo) {
    filter.dueDate = {};
    if (dateFrom) filter.dueDate.$gte = new Date(dateFrom);
    if (dateTo) filter.dueDate.$lte = new Date(dateTo);
  }

  const tasks = await Task.find(filter)
    .populate('project', 'title')
    .populate('stage', 'name')
    .populate('assignedTo', 'name email')
    .lean();

  if (tasks.length === 0) {
    throw new ApiError(400, 'No tasks found');
  }

  // Generate CSV using service
  const csvContent = reportCsvService.generateTasksCSV(tasks);

  res.setHeader('Content-Type', 'text/csv;charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Tasks_Report_${new Date().getTime()}.csv"`
  );

  return res.send('\uFEFF' + csvContent); // BOM for Excel encoding
});

/**
 * EMAIL REPORT
 * POST /api/workspaces/:wid/reports/email
 * 
 * Body: {
 *   reportType: 'tasks',
 *   filters: {...},
 *   to: 'email@example.com,email2@example.com',
 *   subject: 'My Report',
 *   message: 'Optional personal message'
 * }
 */
const emailReport = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  const { reportType = 'tasks', filters, to, subject, message } = req.body;

  if (!to) {
    throw new ApiError(400, 'Email recipients required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const recipients = to.split(',').map(e => e.trim());
  const validRecipients = recipients.filter(e => emailRegex.test(e));

  if (validRecipients.length === 0) {
    throw new ApiError(400, 'No valid email addresses provided');
  }

  // Build filter
  const filter = { workspace: wid };
  if (filters.projectId) filter.project = filters.projectId;
  if (filters.stageId) filter.stage = filters.stageId;
  if (filters.dateFrom || filters.dateTo) {
    filter.dueDate = {};
    if (filters.dateFrom) filter.dueDate.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) filter.dueDate.$lte = new Date(filters.dateTo);
  }

  // Fetch data
  const tasks = await Task.find(filter)
    .populate('project', 'title')
    .populate('stage', 'name')
    .lean();

  if (tasks.length === 0) {
    throw new ApiError(400, 'No data to send');
  }

  // Generate PDF (in-memory, don't save to disk)
  const pdfBuffer = await reportPdfService.generateTasksPDF(tasks, {
    title: subject || 'Tasks Report',
    generatedBy: req.user.name,
    workspace: wid
  });

  // Send email via service
  await reportEmailService.sendReportEmail({
    to: validRecipients,
    subject: subject || `${reportType} Report - ${new Date().toLocaleDateString('en-IN')}`,
    message,
    senderName: req.user.name,
    taskCount: tasks.length,
    pdfBuffer,
    fileName: `${reportType}_report_${new Date().getTime()}.pdf`
  });

  return res.json(
    new ApiResponse(200, null, `Report sent to ${validRecipients.length} recipient(s)`)
  );
});

module.exports = {
  exportTasksExcel,
  exportTasksPDF,
  exportTasksCSV,
  emailReport
};
