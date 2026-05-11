const Task = require('../models/Task');
const TrackerRow = require('../models/TrackerRow');
const SLATracker = require('../models/SLATracker');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const Project = require('../models/Project');
const User = require('../models/User');
const Department = require('../models/Department');
const Timesheet = require('../models/Timesheet');
const MOM = require('../models/MOM');
const Meeting = require('../models/Meeting');
const IntakeForm = require('../models/IntakeForm');
const ApprovalRequest = require('../models/ApprovalRequest');
const MediaFile = require('../models/MediaFile');

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
}

function applyDateRange(query, filters, field = 'createdAt') {
  if (filters.dateFrom || filters.dateTo) {
    query[field] = {};
    if (filters.dateFrom) query[field].$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query[field].$lte = new Date(filters.dateTo);
  }
  return query;
}

function applyRoleBasedReportFilter(query, userContext = {}) {
  const { user, role, department } = userContext;
  if (!user) return query;
  if (user.globalRole === 'super_admin' || role === 'super_admin' || role === 'admin') return query;

  if (role === 'manager') {
    query.$or = [
      { requestedByDepartment: department },
      { department },
      { assignedTo: user._id },
      { handledBy: user._id },
      { createdBy: user._id },
      { requestedBy: user._id }
    ];
  } else if (role === 'member') {
    query.$or = [
      { assignedTo: user._id },
      { handledBy: user._id },
      { createdBy: user._id },
      { requestedBy: user._id }
    ];
  } else if (role === 'viewer') {
    query.visibility = { $ne: 'private' };
  }
  return query;
}

function buildTaskQuery({ workspace, filters = {}, userContext = {} }) {
  const query = { workspace };
  if (!filters.includeArchived) query.status = { $ne: 'cancelled' };
  applyDateRange(query, filters, filters.dateField || 'createdAt');
  if (asArray(filters.statuses).length) query.status = { $in: asArray(filters.statuses) };
  if (asArray(filters.priorities).length) query.priority = { $in: asArray(filters.priorities) };
  if (asArray(filters.users).length) query.$or = [{ assignedTo: { $in: asArray(filters.users) } }, { handledBy: { $in: asArray(filters.users) } }];
  if (asArray(filters.departments).length) query.requestedByDepartment = { $in: asArray(filters.departments) };
  if (asArray(filters.projects).length) query.project = { $in: asArray(filters.projects) };
  if (asArray(filters.taskTypes).length) query.taskCategory = { $in: asArray(filters.taskTypes) };
  if (asArray(filters.productTypes).length) query.productType = { $in: asArray(filters.productTypes) };
  if (asArray(filters.delayStatuses).length) query.delayStatus = { $in: asArray(filters.delayStatuses) };
  applyRoleBasedReportFilter(query, userContext);
  return query;
}

async function getTrackerReportData({ workspace, filters = {}, userContext = {} }) {
  const query = { workspace };
  if (!filters.includeArchived) {
    query.isDeleted = { $ne: true };
    query.status = { $ne: 'archived' };
  }
  applyDateRange(query, filters, filters.dateField || 'createdAt');
  if (asArray(filters.statuses).length) query.status = { $in: asArray(filters.statuses) };

  let rows = await TrackerRow.find(query)
    .populate('task', 'taskNumber title status priority dueDate assignedTo requestedByDepartment')
    .lean();

  if (asArray(filters.taskTypes).length) rows = rows.filter((row) => asArray(filters.taskTypes).includes(row.rowData?.type_of_task));
  if (asArray(filters.productTypes).length) rows = rows.filter((row) => asArray(filters.productTypes).includes(row.rowData?.type_of_product));
  if (asArray(filters.delayStatuses).length) rows = rows.filter((row) => asArray(filters.delayStatuses).some((status) => String(row.calculatedData?.delay_in_time || '').toLowerCase().includes(String(status).toLowerCase())));

  if (userContext.role === 'manager' && userContext.department) {
    rows = rows.filter((row) => String(row.rowData?.task_given_by_department || row.task?.requestedByDepartment || '') === String(userContext.department));
  } else if (userContext.role === 'member') {
    rows = rows.filter((row) => String(row.rowData?.task_handled_by || row.task?.assignedTo?.[0] || row.createdBy || '') === String(userContext.user._id));
  }

  return rows;
}

async function getTaskReportData({ workspace, filters = {}, userContext = {} }) {
  return Task.find(buildTaskQuery({ workspace, filters, userContext }))
    .populate('assignedTo', 'name email designation department')
    .populate('handledBy', 'name email designation department')
    .populate('requestedBy', 'name email')
    .populate('requestedByDepartment', 'name code')
    .populate('project', 'title name projectCode code')
    .populate('stage', 'name title')
    .lean();
}

async function getSlaReportData({ workspace, filters = {}, userContext = {} }) {
  const query = { workspace };
  applyDateRange(query, filters, 't0Date');
  if (asArray(filters.slaStatuses).length) query.overallStatus = { $in: asArray(filters.slaStatuses) };
  const slas = await SLATracker.find(query)
    .populate({
      path: 'task',
      select: 'taskNumber title deliverableType taskCategory requestedByDepartment assignedTo handledBy',
      populate: [
        { path: 'requestedByDepartment', select: 'name code' },
        { path: 'assignedTo', select: 'name email' },
        { path: 'handledBy', select: 'name email' }
      ]
    })
    .lean();

  if (['admin', 'super_admin'].includes(userContext.role) || userContext.user?.globalRole === 'super_admin') return slas;
  if (userContext.role === 'manager') return slas.filter((sla) => String(sla.task?.requestedByDepartment?._id || '') === String(userContext.department));
  if (userContext.role === 'member') return slas.filter((sla) => String(sla.task?.handledBy?._id || sla.task?.assignedTo?.[0]?._id || '') === String(userContext.user._id));
  return slas;
}

async function getBudgetReportData({ workspace, filters = {} }) {
  const budgetQuery = { workspace };
  const expenseQuery = { workspace };
  applyDateRange(budgetQuery, filters, 'createdAt');
  applyDateRange(expenseQuery, filters, 'paymentDate');
  if (asArray(filters.departments).length) budgetQuery.department = { $in: asArray(filters.departments) };
  if (asArray(filters.projects).length) {
    budgetQuery.project = { $in: asArray(filters.projects) };
    expenseQuery.project = { $in: asArray(filters.projects) };
  }
  if (filters.fiscalYear) budgetQuery.fiscalYear = filters.fiscalYear;
  if (filters.month) budgetQuery.month = Number(filters.month);
  if (asArray(filters.statuses).length) {
    budgetQuery.status = { $in: asArray(filters.statuses) };
    expenseQuery.status = { $in: asArray(filters.statuses) };
  }
  const [budgets, expenses] = await Promise.all([
    Budget.find(budgetQuery).populate('project', 'title name projectCode').populate('department', 'name code').populate('approvedBy', 'name').lean(),
    Expense.find(expenseQuery).populate('budget', 'title budgetNumber').populate('category', 'name title').populate('project', 'title name').populate('vendor', 'name').populate('approvedBy', 'name').lean()
  ]);
  return { budgets, expenses };
}

async function getUserPerformanceData(args) {
  const [tasks, timesheets] = await Promise.all([
    getTaskReportData(args),
    Timesheet.find({ workspace: args.workspace }).populate('user', 'name email designation department').lean()
  ]);
  return { tasks, timesheets };
}

async function getDepartmentReportData(args) {
  const [tasks, departments] = await Promise.all([
    getTaskReportData(args),
    Department.find({ workspace: args.workspace }).lean()
  ]);
  return { tasks, departments };
}

async function getProjectReportData(args) {
  const [tasks, projects] = await Promise.all([
    getTaskReportData(args),
    Project.find({ workspace: args.workspace }).populate('department', 'name code').lean()
  ]);
  return { tasks, projects };
}

async function getMonthlyManagementData(args) {
  const [tasks, trackerRows, slas, budgetData, meetings, moms] = await Promise.all([
    getTaskReportData(args),
    getTrackerReportData(args),
    getSlaReportData(args),
    getBudgetReportData(args),
    Meeting.find({ workspace: args.workspace }).lean(),
    MOM.find({ workspace: args.workspace }).lean()
  ]);
  return { tasks, trackerRows, slas, budgets: budgetData.budgets, expenses: budgetData.expenses, meetings, moms };
}

async function getSimpleCollectionReportData({ workspace, filters = {}, modelName }) {
  const modelMap = {
    meeting: Meeting,
    mom: MOM,
    timesheet: Timesheet,
    intake: IntakeForm,
    approval: ApprovalRequest,
    media: MediaFile
  };
  const Model = modelMap[modelName];
  if (!Model) return [];
  const query = { workspace };
  applyDateRange(query, filters);
  return Model.find(query).lean();
}

module.exports = {
  applyRoleBasedReportFilter,
  buildTaskQuery,
  getTrackerReportData,
  getTaskReportData,
  getSlaReportData,
  getBudgetReportData,
  getUserPerformanceData,
  getDepartmentReportData,
  getProjectReportData,
  getMonthlyManagementData,
  getSimpleCollectionReportData
};
