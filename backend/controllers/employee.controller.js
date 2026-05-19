const asyncHandler = require('../utils/asyncHandler');
const EmployeeProfile = require('../models/EmployeeProfile');
const EmployeeDocument = require('../models/EmployeeDocument');
const EmployeeActivity = require('../models/EmployeeActivity');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Department = require('../models/Department');
const Designation = require('../models/Designation');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Timesheet = require('../models/Timesheet');
const Meeting = require('../models/Meeting');
const MOMPoint = require('../models/MOMPoint');
const employeeReportService = require('../services/employeeReport.service');
const employeeNumberService = require('../services/employeeNumber.service');
const employeeActivityService = require('../services/employeeActivity.service');
const employeeWorkloadService = require('../services/employeeWorkload.service');
const employeeService = require('../services/employee.service');
const notificationService = require('../services/notification.service');

const workspaceId = (req) => req.params.wid || req.body.workspace || req.query.workspace || req.workspace?._id;
const employeeId = (req) => req.params.employeeId || req.params.id;

function publicPatch(body) {
  const allowed = ['phone', 'alternatePhone', 'bio', 'skills', 'socialLinks', 'preferences', 'emergencyContact', 'availabilityStatus', 'availabilityMessage'];
  return Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));
}

const list = asyncHandler(async (req, res) => {
  const query = { workspace: workspaceId(req), isDeleted: { $ne: true } };
  if (req.query.department) query.department = req.query.department;
  if (req.query.designation) query.designation = req.query.designation;
  if (req.query.role) query.workspaceRole = req.query.role;
  if (req.query.status) query.employmentStatus = req.query.status;
  if (req.query.availability) query.availabilityStatus = req.query.availability;
  if (req.query.employeeType) query.employeeType = req.query.employeeType;
  if (req.query.search) {
    const search = new RegExp(req.query.search, 'i');
    query.$or = [{ employeeCode: search }, { displayName: search }, { email: search }, { phone: search }, { jobTitle: search }, { 'skills.name': search }];
  }
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const [items, total] = await Promise.all([
    EmployeeProfile.find(query)
      .populate('user', 'name email avatar lastLoginAt')
      .populate('department', 'name code')
      .populate('designation', 'title code')
      .populate('reportingManager', 'name email')
      .sort({ displayName: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    EmployeeProfile.countDocuments(query),
  ]);
  res.json({ success: true, data: items, employees: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

const create = asyncHandler(async (req, res) => {
  const workspace = workspaceId(req);
  const email = String(req.body.email || '').toLowerCase().trim();
  if (!req.body.firstName || !email) return res.status(400).json({ success: false, message: 'First name and email are required' });
  if (await EmployeeProfile.exists({ workspace, email, isDeleted: { $ne: true } })) return res.status(409).json({ success: false, message: 'Employee email already exists in this workspace' });
  if (req.body.department && !await Department.exists({ _id: req.body.department, workspace, isActive: { $ne: false }, isDeleted: { $ne: true } })) return res.status(400).json({ success: false, message: 'Department must be active in this workspace' });
  if (req.body.designation && !await Designation.exists({ _id: req.body.designation, workspace, isActive: { $ne: false } })) return res.status(400).json({ success: false, message: 'Designation must be active in this workspace' });
  if (req.body.reportingManager && !await EmployeeProfile.exists({ workspace, user: req.body.reportingManager, employmentStatus: { $nin: ['inactive', 'terminated', 'suspended'] }, isDeleted: { $ne: true } })) return res.status(400).json({ success: false, message: 'Reporting manager must be an active workspace employee' });

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: `${req.body.firstName} ${req.body.lastName || ''}`.trim(),
      email,
      phone: req.body.phone,
      status: 'pending_verification',
      globalRole: 'user',
      role: req.body.workspaceRole || 'member',
      createdBy: req.user?._id,
    });
  }

  const alreadyMember = user.workspaces?.some((item) => item.workspace?.toString() === workspace.toString() && item.isActive !== false);
  if (!alreadyMember) {
    user.workspaces.push({ workspace, role: req.body.workspaceRole || 'member', department: req.body.department, joinedAt: new Date(), addedBy: req.user?._id, isActive: true });
    user.defaultWorkspace = user.defaultWorkspace || workspace;
    await user.save({ validateBeforeSave: false });
  }

  await Workspace.updateOne(
    { _id: workspace, 'members.user': { $ne: user._id } },
    { $addToSet: { members: { user: user._id, role: req.body.workspaceRole || 'member', department: req.body.department, designation: req.body.jobTitle, addedAt: new Date(), addedBy: req.user?._id, isActive: true } } }
  );

  const employeeCode = await employeeNumberService.generateEmployeeCode(workspace);
  const employee = await EmployeeProfile.create({
    ...req.body,
    workspace,
    user: user._id,
    employeeCode,
    displayName: `${req.body.firstName} ${req.body.lastName || ''}`.trim(),
    email,
    workspaceRole: req.body.workspaceRole || 'member',
    employmentStatus: req.body.employmentStatus || 'invited',
    createdBy: req.user?._id,
  });

  if (req.body.department) {
    await Department.updateOne(
      { _id: req.body.department, workspace },
      { $addToSet: { members: { user: user._id, roleInDepartment: req.body.workspaceRole === 'manager' ? 'manager' : 'member', designation: req.body.jobTitle, joinedAt: new Date() } } }
    );
  }

  await employeeActivityService.log({ workspace, employee: employee._id, user: user._id, action: 'created', message: `Employee ${employee.employeeCode} created`, performedBy: req.user?._id });
  if (notificationService?.notify) {
    await notificationService.notify({
      workspace,
      sender: req.user?._id,
      recipients: [user._id],
      type: 'employee_invited',
      title: 'You have been invited to the workspace',
      message: `${employee.displayName} has been added as ${employee.workspaceRole}.`,
      refModel: 'EmployeeProfile',
      refId: employee._id,
      actionUrl: '/directory',
      channels: { inApp: true, email: true },
    });
  }
  res.status(201).json({ success: true, message: 'Employee created successfully', data: employee, employee });
});

const getMe = asyncHandler(async (req, res) => {
  const employee = await EmployeeProfile.findOne({ workspace: workspaceId(req), user: req.user?._id, isDeleted: { $ne: true } }).populate('department designation reportingManager', 'name title code email');
  if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });
  res.json({ success: true, data: employee, employee });
});

const updateMe = asyncHandler(async (req, res) => {
  const employee = await EmployeeProfile.findOneAndUpdate(
    { workspace: workspaceId(req), user: req.user?._id, isDeleted: { $ne: true } },
    { ...publicPatch(req.body), updatedBy: req.user?._id },
    { new: true, runValidators: true }
  );
  if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });
  await employeeActivityService.log({ workspace: workspaceId(req), employee: employee._id, user: employee.user, action: 'updated', message: 'Employee profile updated', performedBy: req.user?._id });
  res.json({ success: true, data: employee, employee });
});

const getById = asyncHandler(async (req, res) => {
  const employee = await EmployeeProfile.findOne({ _id: employeeId(req), workspace: workspaceId(req), isDeleted: { $ne: true } })
    .populate('user', 'name email avatar lastLoginAt')
    .populate('department', 'name code')
    .populate('designation', 'title code')
    .populate('reportingManager', 'name email');
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  res.json({ success: true, data: employee, employee });
});

const update = asyncHandler(async (req, res) => {
  const employee = await EmployeeProfile.findOne({ _id: employeeId(req), workspace: workspaceId(req), isDeleted: { $ne: true } });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  if (req.body.reportingManager && await employeeService.checkCircularManager(employee.user, req.body.reportingManager, workspaceId(req))) {
    return res.status(400).json({ success: false, message: 'Circular reporting manager hierarchy is not allowed' });
  }
  if (req.body.reportingManager && !await EmployeeProfile.exists({ workspace: workspaceId(req), user: req.body.reportingManager, employmentStatus: { $nin: ['inactive', 'terminated', 'suspended'] }, isDeleted: { $ne: true } })) {
    return res.status(400).json({ success: false, message: 'Reporting manager must be an active workspace employee' });
  }
  const oldValue = employee.toObject();
  Object.assign(employee, req.body, { updatedBy: req.user?._id });
  await employee.save();
  await syncMembership(employee);
  await syncDepartmentMembership({ employee, oldDepartment: oldValue.department });
  await employeeActivityService.log({ workspace: workspaceId(req), employee: employee._id, user: employee.user, action: 'updated', message: 'Employee profile updated', oldValue, newValue: employee, performedBy: req.user?._id });
  res.json({ success: true, data: employee, employee });
});

async function syncMembership(employee) {
  await Workspace.updateOne(
    { _id: employee.workspace, 'members.user': employee.user },
    { $set: { 'members.$.role': employee.workspaceRole, 'members.$.department': employee.department, 'members.$.designation': employee.jobTitle, 'members.$.isActive': !['inactive', 'suspended', 'terminated'].includes(employee.employmentStatus) } }
  );
  const user = await User.findById(employee.user);
  const membership = user?.workspaces?.find((item) => item.workspace?.toString() === employee.workspace.toString());
  if (membership) {
    membership.role = employee.workspaceRole;
    membership.department = employee.department;
    membership.isActive = !['inactive', 'suspended', 'terminated'].includes(employee.employmentStatus);
    await user.save({ validateBeforeSave: false });
  }
}

async function syncDepartmentMembership({ employee, oldDepartment }) {
  if (oldDepartment && oldDepartment.toString() !== employee.department?.toString()) {
    await Department.updateOne({ _id: oldDepartment, workspace: employee.workspace }, { $pull: { members: { user: employee.user } } });
  }
  if (employee.department) {
    await Department.updateOne(
      { _id: employee.department, workspace: employee.workspace },
      {
        $pull: { members: { user: employee.user } },
      }
    );
    await Department.updateOne(
      { _id: employee.department, workspace: employee.workspace },
      {
        $addToSet: {
          members: {
            user: employee.user,
            role: employee.workspaceRole === 'manager' ? 'manager' : 'member',
            roleInDepartment: employee.workspaceRole === 'manager' ? 'manager' : 'member',
            designation: employee.jobTitle,
            joinedAt: new Date(),
          },
        },
      }
    );
  }
}

const softDelete = asyncHandler(async (req, res) => {
  const employee = await EmployeeProfile.findOne({ _id: employeeId(req), workspace: workspaceId(req), isDeleted: { $ne: true } });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  employee.isDeleted = true;
  employee.deletedAt = new Date();
  employee.deletedBy = req.user?._id;
  await employee.save();
  await employeeActivityService.log({ workspace: workspaceId(req), employee: employee._id, user: employee.user, action: 'deleted', message: 'Employee deleted', performedBy: req.user?._id });
  res.json({ success: true, message: 'Employee deleted' });
});

const setStatus = (status, action) => asyncHandler(async (req, res) => {
  const employee = await EmployeeProfile.findOne({ _id: employeeId(req), workspace: workspaceId(req), isDeleted: { $ne: true } });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  employee.employmentStatus = req.body.status || status;
  if (employee.employmentStatus === 'terminated') employee.exitDate = employee.exitDate || new Date();
  await employee.save();
  await syncMembership(employee);
  if (req.body.reassignTasksTo) {
    await Task.updateMany(
      { workspace: workspaceId(req), assignedTo: employee.user, status: { $nin: ['closed', 'completed', 'cancelled'] }, isDeleted: { $ne: true } },
      { assignedTo: req.body.reassignTasksTo }
    );
  }
  await employeeActivityService.log({ workspace: workspaceId(req), employee: employee._id, user: employee.user, action, message: req.body.reason || `Employee ${action}`, performedBy: req.user?._id });
  res.json({ success: true, data: employee, employee });
});

const updateAvailability = asyncHandler(async (req, res) => {
  const employee = await EmployeeProfile.findOneAndUpdate(
    { workspace: workspaceId(req), user: req.user?._id, isDeleted: { $ne: true } },
    { availabilityStatus: req.body.availabilityStatus, availabilityMessage: req.body.availabilityMessage, updatedBy: req.user?._id },
    { new: true }
  );
  if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });
  await employeeActivityService.log({ workspace: workspaceId(req), employee: employee._id, user: employee.user, action: 'availability_changed', message: 'Availability updated', performedBy: req.user?._id });
  res.json({ success: true, data: employee, employee });
});

const patchField = (field, action) => asyncHandler(async (req, res) => {
  const employee = await EmployeeProfile.findOne({ _id: employeeId(req), workspace: workspaceId(req), isDeleted: { $ne: true } });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  const oldDepartment = employee.department;
  if (field === 'reportingManager' && (req.body[field] || req.body.value) && await employeeService.checkCircularManager(employee.user, req.body[field] || req.body.value, workspaceId(req))) {
    return res.status(400).json({ success: false, message: 'Circular reporting manager hierarchy is not allowed' });
  }
  employee[field] = req.body[field] || req.body.value;
  await employee.save();
  await syncMembership(employee);
  if (field === 'department') await syncDepartmentMembership({ employee, oldDepartment });
  await employeeActivityService.log({ workspace: workspaceId(req), employee: employee._id, user: employee.user, action, message: `${field} updated`, performedBy: req.user?._id });
  res.json({ success: true, data: employee, employee });
});

const addSkill = asyncHandler(async (req, res) => {
  const employee = await EmployeeProfile.findOne({ _id: employeeId(req), workspace: workspaceId(req), isDeleted: { $ne: true } });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  employee.skills.push(req.body);
  await employee.save();
  await employeeActivityService.log({ workspace: workspaceId(req), employee: employee._id, user: employee.user, action: 'skill_added', message: 'Skill added', performedBy: req.user?._id });
  res.status(201).json({ success: true, data: employee.skills[employee.skills.length - 1], employee });
});

const updateSkill = asyncHandler(async (req, res) => {
  const employee = await EmployeeProfile.findOne({ _id: employeeId(req), workspace: workspaceId(req), isDeleted: { $ne: true } });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  const skill = employee.skills.id(req.params.skillId);
  if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
  Object.assign(skill, req.body);
  await employee.save();
  await employeeActivityService.log({ workspace: workspaceId(req), employee: employee._id, user: employee.user, action: 'skill_added', message: 'Skill updated', performedBy: req.user?._id });
  res.json({ success: true, data: skill, employee });
});

const removeSkill = asyncHandler(async (req, res) => {
  const employee = await EmployeeProfile.findOne({ _id: employeeId(req), workspace: workspaceId(req), isDeleted: { $ne: true } });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  employee.skills = employee.skills.filter((skill) => skill._id.toString() !== req.params.skillId);
  await employee.save();
  await employeeActivityService.log({ workspace: workspaceId(req), employee: employee._id, user: employee.user, action: 'skill_removed', message: 'Skill removed', performedBy: req.user?._id });
  res.json({ success: true, message: 'Skill removed' });
});

const skills = asyncHandler(async (req, res) => {
  const rows = await EmployeeProfile.aggregate([
    { $match: { workspace: req.workspace._id, isDeleted: { $ne: true } } },
    { $unwind: '$skills' },
    { $group: { _id: '$skills.name', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  res.json({ success: true, data: rows, skills: rows });
});

const documents = asyncHandler(async (req, res) => {
  const items = await EmployeeDocument.find({ workspace: workspaceId(req), employee: employeeId(req), isDeleted: { $ne: true } }).sort({ createdAt: -1 });
  res.json({ success: true, data: items, documents: items });
});

const addDocument = asyncHandler(async (req, res) => {
  const employee = await EmployeeProfile.findOne({ _id: employeeId(req), workspace: workspaceId(req), isDeleted: { $ne: true } });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  const item = await EmployeeDocument.create({ ...req.body, workspace: workspaceId(req), employee: employee._id, user: employee.user, uploadedBy: req.user?._id });
  await employeeActivityService.log({ workspace: workspaceId(req), employee: employee._id, user: employee.user, action: 'document_uploaded', message: 'Document uploaded', performedBy: req.user?._id });
  res.status(201).json({ success: true, data: item, document: item });
});

const deleteDocument = asyncHandler(async (req, res) => {
  const item = await EmployeeDocument.findOneAndUpdate({ _id: req.params.documentId, workspace: workspaceId(req), employee: employeeId(req) }, { isDeleted: true }, { new: true });
  if (!item) return res.status(404).json({ success: false, message: 'Document not found' });
  res.json({ success: true, message: 'Document deleted' });
});

const verifyDocument = asyncHandler(async (req, res) => {
  const item = await EmployeeDocument.findOneAndUpdate({ _id: req.params.documentId, workspace: workspaceId(req), employee: employeeId(req) }, { isVerified: true, verifiedBy: req.user?._id, verifiedAt: new Date() }, { new: true });
  if (!item) return res.status(404).json({ success: false, message: 'Document not found' });
  res.json({ success: true, data: item, document: item });
});

const profileImage = asyncHandler(async (req, res) => {
  const employee = await EmployeeProfile.findOneAndUpdate({ _id: employeeId(req), workspace: workspaceId(req) }, { profileImage: req.body.profileImage || { mediaFile: req.body.mediaFile, url: req.body.url } }, { new: true });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  await User.findByIdAndUpdate(employee.user, { avatar: employee.profileImage?.url });
  await employeeActivityService.log({ workspace: workspaceId(req), employee: employee._id, user: employee.user, action: 'profile_image_updated', message: 'Profile image updated', performedBy: req.user?._id });
  res.json({ success: true, data: employee, employee });
});

const removeProfileImage = asyncHandler(async (req, res) => {
  const employee = await EmployeeProfile.findOneAndUpdate({ _id: employeeId(req), workspace: workspaceId(req) }, { $unset: { profileImage: '' } }, { new: true });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  res.json({ success: true, data: employee, employee });
});

const tasks = asyncHandler(async (req, res) => {
  const employee = await EmployeeProfile.findOne({ _id: employeeId(req), workspace: workspaceId(req) });
  const items = await Task.find({ workspace: workspaceId(req), assignedTo: employee?.user, isDeleted: { $ne: true } }).sort({ dueDate: 1 });
  res.json({ success: true, data: items, tasks: items });
});

const projects = asyncHandler(async (req, res) => {
  const employee = await EmployeeProfile.findOne({ _id: employeeId(req), workspace: workspaceId(req) });
  const items = await Project.find({ workspace: workspaceId(req), 'members.user': employee?.user, isDeleted: { $ne: true } }).sort({ updatedAt: -1 });
  res.json({ success: true, data: items, projects: items });
});

const timesheets = asyncHandler(async (req, res) => {
  const employee = await EmployeeProfile.findOne({ _id: employeeId(req), workspace: workspaceId(req) });
  const items = await Timesheet.find({ workspace: workspaceId(req), user: employee?.user }).sort({ periodStart: -1 }).limit(20);
  res.json({ success: true, data: items, timesheets: items });
});

const meetings = asyncHandler(async (req, res) => {
  const employee = await EmployeeProfile.findOne({ _id: employeeId(req), workspace: workspaceId(req) });
  const items = await Meeting.find({ workspace: workspaceId(req), $or: [{ organizer: employee?.user }, { 'attendees.user': employee?.user }], isDeleted: { $ne: true } }).sort({ startTime: -1 }).limit(50);
  res.json({ success: true, data: items, meetings: items });
});

const momPoints = asyncHandler(async (req, res) => {
  const employee = await EmployeeProfile.findOne({ _id: employeeId(req), workspace: workspaceId(req) });
  const items = await MOMPoint.find({ workspace: workspaceId(req), assignedTo: employee?.user, isDeleted: { $ne: true } }).sort({ dueDate: 1 }).limit(50);
  res.json({ success: true, data: items, momPoints: items });
});

const workload = asyncHandler(async (req, res) => {
  const summary = await employeeWorkloadService.recalculateEmployeeWorkload(employeeId(req));
  res.json({ success: true, data: summary, workload: summary });
});

const activity = asyncHandler(async (req, res) => {
  const items = await EmployeeActivity.find({ workspace: workspaceId(req), employee: employeeId(req) }).populate('performedBy', 'name email').sort({ createdAt: -1 });
  res.json({ success: true, data: items, activity: items });
});

const orgChart = asyncHandler(async (req, res) => {
  const employees = await EmployeeProfile.find({ workspace: workspaceId(req), employmentStatus: { $nin: ['inactive', 'terminated'] }, isDeleted: { $ne: true } }).populate('user', 'name email').populate('department', 'name');
  res.json({ success: true, data: employeeService.buildOrgTree(employees) });
});

const reports = asyncHandler(async (req, res) => {
  const report = await employeeReportService.buildEmployeeReport(workspaceId(req));
  res.json({ success: true, data: report });
});

module.exports = {
  list,
  getAll: list,
  create,
  getMe,
  updateMe,
  getById,
  getOne: getById,
  update,
  remove: softDelete,
  delete: softDelete,
  deactivate: setStatus('inactive', 'deactivated'),
  reactivate: setStatus('active', 'reactivated'),
  status: setStatus('active', 'status_changed'),
  role: patchField('workspaceRole', 'role_changed'),
  department: patchField('department', 'department_changed'),
  manager: patchField('reportingManager', 'manager_changed'),
  updateAvailability,
  profileImage,
  removeProfileImage,
  skills,
  addSkill,
  updateSkill,
  removeSkill,
  documents,
  addDocument,
  deleteDocument,
  verifyDocument,
  tasks,
  projects,
  timesheets,
  meetings,
  momPoints,
  workload,
  activity,
  orgChart,
  reports,
};
