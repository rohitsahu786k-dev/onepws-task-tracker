const EmployeeProfile = require('../models/EmployeeProfile');
const Designation = require('../models/Designation');

async function checkCircularManager(employeeUserId, managerUserId, workspace) {
  let currentManagerId = managerUserId;
  while (currentManagerId) {
    if (currentManagerId.toString() === employeeUserId.toString()) return true;
    const managerProfile = await EmployeeProfile.findOne({ workspace, user: currentManagerId }).select('reportingManager');
    currentManagerId = managerProfile?.reportingManager;
  }
  return false;
}

function buildOrgTree(employees) {
  const byUser = new Map();
  employees.forEach((employee) => byUser.set(employee.user?._id?.toString() || employee.user?.toString(), { employee, children: [] }));
  const roots = [];
  byUser.forEach((node) => {
    const managerId = node.employee.reportingManager?.toString();
    if (managerId && byUser.has(managerId)) byUser.get(managerId).children.push(node);
    else roots.push(node);
  });
  const serialize = (node) => ({
    user: node.employee.user,
    employee: node.employee._id,
    name: node.employee.displayName,
    designation: node.employee.jobTitle,
    department: node.employee.department,
    children: node.children.map(serialize),
  });
  return roots.map(serialize);
}

const DEFAULT_DESIGNATIONS = [
  { title: 'Marketing Head', code: 'MKT-HEAD', level: 1, roleCategory: 'leadership' },
  { title: 'Marketing Manager', code: 'MKT-MGR', level: 2, roleCategory: 'manager' },
  { title: 'Graphic Designer', code: 'DES-GD', level: 3, roleCategory: 'designer' },
  { title: 'Content Writer', code: 'CNT-WR', level: 3, roleCategory: 'content' },
  { title: 'Finance Executive', code: 'FIN-EXE', level: 3, roleCategory: 'finance' },
  { title: 'Admin Executive', code: 'ADM-EXE', level: 3, roleCategory: 'admin' },
  { title: 'Project Coordinator', code: 'PRJ-CO', level: 3, roleCategory: 'executive' },
  { title: 'Vendor Coordinator', code: 'VEN-CO', level: 3, roleCategory: 'support' },
];

async function seedDefaultDesignations(workspace, user) {
  const existing = await Designation.countDocuments({ workspace });
  if (existing) return [];
  return Designation.insertMany(DEFAULT_DESIGNATIONS.map((item) => ({ ...item, workspace, createdBy: user, isActive: true })));
}

function normalizeModules(modules) {
  if (Array.isArray(modules)) return modules;
  if (modules && typeof modules === 'object') return Object.entries(modules).filter(([, value]) => value === true).map(([key]) => key);
  return [];
}

function canAccessModule({ workspaceSettings, department, user, moduleKey }) {
  const workspaceModules = workspaceSettings?.modules || workspaceSettings?.allowedModules || workspaceSettings || {};
  const workspaceModuleEnabled = workspaceModules[moduleKey] !== false;
  const departmentAllowed = normalizeModules(department?.allowedModules).includes(moduleKey);
  const userAllowed =
    normalizeModules(user?.modulesAllowed).includes(moduleKey) ||
    ['admin', 'owner'].includes(user?.workspaceRole || user?.role);
  return workspaceModuleEnabled && (departmentAllowed || userAllowed);
}

async function checkEmployeeAccess(req, res, next) {
  const employee = await EmployeeProfile.findOne({
    _id: req.params.employeeId,
    workspace: req.workspace._id,
    isDeleted: { $ne: true },
  });

  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  req.employeeProfile = employee;

  if (req.user.globalRole === 'super_admin' || ['owner', 'admin'].includes(req.workspaceRole)) {
    req.employeePermission = 'admin';
    return next();
  }

  const userId = req.user._id.toString();
  if (employee.user.toString() === userId) {
    req.employeePermission = 'self';
    return next();
  }

  const sameDepartment = employee.department?.toString() === req.workspaceDepartment?.toString();
  if (req.workspaceRole === 'manager' && sameDepartment) {
    req.employeePermission = 'manager';
    return next();
  }

  if (employee.isDirectoryVisible) {
    req.employeePermission = 'view';
    return next();
  }

  return res.status(403).json({ success: false, message: 'You do not have access to this employee profile' });
}

module.exports = {
  DEFAULT_DESIGNATIONS,
  seedDefaultDesignations,
  checkCircularManager,
  buildOrgTree,
  normalizeModules,
  canAccessModule,
  checkEmployeeAccess,
};
