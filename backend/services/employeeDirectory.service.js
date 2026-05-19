const EmployeeProfile = require('../models/EmployeeProfile');

async function listDirectory({ workspace, filters = {} }) {
  const query = { workspace, isDeleted: { $ne: true }, isDirectoryVisible: { $ne: false } };
  if (filters.activeOnly !== false) query.employmentStatus = { $nin: ['inactive', 'terminated', 'suspended'] };
  if (filters.department) query.department = filters.department;
  if (filters.role) query.workspaceRole = filters.role;
  return EmployeeProfile.find(query)
    .populate('user', 'name email avatar lastActiveAt')
    .populate('department', 'name code')
    .populate('designation', 'title code')
    .sort({ displayName: 1 });
}

module.exports = { listDirectory };
