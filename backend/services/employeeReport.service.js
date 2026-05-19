const EmployeeProfile = require('../models/EmployeeProfile');

async function buildEmployeeReport(workspace) {
  const [total, active, invited, inactive, onLeave, byDepartment, byRole, byStatus, employees] = await Promise.all([
    EmployeeProfile.countDocuments({ workspace, isDeleted: { $ne: true } }),
    EmployeeProfile.countDocuments({ workspace, employmentStatus: 'active', isDeleted: { $ne: true } }),
    EmployeeProfile.countDocuments({ workspace, employmentStatus: 'invited', isDeleted: { $ne: true } }),
    EmployeeProfile.countDocuments({ workspace, employmentStatus: { $in: ['inactive', 'suspended', 'terminated'] }, isDeleted: { $ne: true } }),
    EmployeeProfile.countDocuments({ workspace, employmentStatus: 'on_leave', isDeleted: { $ne: true } }),
    EmployeeProfile.aggregate([{ $match: { workspace, isDeleted: { $ne: true } } }, { $group: { _id: '$department', count: { $sum: 1 } } }]),
    EmployeeProfile.aggregate([{ $match: { workspace, isDeleted: { $ne: true } } }, { $group: { _id: '$workspaceRole', count: { $sum: 1 } } }]),
    EmployeeProfile.aggregate([{ $match: { workspace, isDeleted: { $ne: true } } }, { $group: { _id: '$employmentStatus', count: { $sum: 1 } } }]),
    EmployeeProfile.find({ workspace, isDeleted: { $ne: true } }).populate('department designation reportingManager', 'name title email code').sort({ displayName: 1 }),
  ]);
  return { total, active, invited, inactive, onLeave, byDepartment, byRole, byStatus, employees };
}

module.exports = { buildEmployeeReport };
