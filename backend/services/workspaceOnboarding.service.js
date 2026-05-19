const Department = require('../models/Department');
const PermissionConfig = require('../models/PermissionConfig');
const { DEFAULT_ROLE_PERMISSIONS } = require('../constants/defaultPermissions');
const wikiService = require('./wiki.service');
const wikiTemplateService = require('./wikiTemplate.service');
const employeeService = require('./employee.service');

const DEFAULT_DEPARTMENTS = [
  {
    name: 'Marketing',
    code: 'MKT',
    permissions: { canCreateRequest: true, canViewOwnRequests: true, canViewDepartmentRequests: true, canAccessReports: true, canAccessTracker: true },
    allowedModules: { tasks: true, tracker: true, calendar: true, mom: true, meetings: true, reports: true, media: true, intake: true }
  },
  { name: 'Design', code: 'DES', allowedModules: { tasks: true, calendar: true, media: true, timesheets: true, notes: true } },
  { name: 'Content', code: 'CNT', allowedModules: { tasks: true, calendar: true, notes: true, wiki: true, campaigns: true, contentCalendar: true } },
  { name: 'Sales', code: 'SAL', permissions: { canCreateRequest: true, canViewOwnRequests: true }, allowedModules: { intake: true, tasks: true, calendar: true, mom: true, meetings: true, media: true } },
  { name: 'Admin', code: 'ADM', allowedModules: { dashboard: true, tasks: true, reports: true, settings: true } },
  { name: 'Finance', code: 'FIN', allowedModules: { budget: true, expenses: true, reports: true } },
  { name: 'Management', code: 'MGT', permissions: { canAccessReports: true }, allowedModules: { dashboard: true, projects: true, tasks: true, reports: true, budget: true, expenses: true, sla: true } },
  { name: 'Vendor / External', code: 'EXT', allowedModules: { tasks: true, media: true } }
];

async function createDefaultDepartments(workspaceId, userId) {
  const existing = await Department.countDocuments({ workspace: workspaceId });
  if (existing) return [];
  return Department.insertMany(DEFAULT_DEPARTMENTS.map((item) => ({
    workspace: workspaceId,
    ...item,
    isSystemDepartment: true,
    isActive: true,
    createdBy: userId
  })));
}

async function createDefaultPermissionConfig(workspaceId, userId) {
  const existing = await PermissionConfig.countDocuments({ workspace: workspaceId });
  if (existing) return [];
  return PermissionConfig.insertMany(Object.entries(DEFAULT_ROLE_PERMISSIONS).map(([role, permissions]) => ({
    workspace: workspaceId,
    role,
    permissions,
    createdBy: userId
  })));
}

async function setupDefaults({ workspace, user }) {
  const departments = await createDefaultDepartments(workspace._id, user._id);
  const wikiCategories = await wikiService.seedDefaultWikiCategories(workspace._id, user._id);
  const wikiTemplates = await wikiTemplateService.seedDefaultWikiTemplates(workspace._id, user._id);
  const designations = await employeeService.seedDefaultDesignations(workspace._id, user._id);
  await createDefaultPermissionConfig(workspace._id, user._id);
  return { departments, wikiCategories, wikiTemplates, designations };
}

module.exports = { DEFAULT_DEPARTMENTS, createDefaultDepartments, createDefaultPermissionConfig, setupDefaults };
