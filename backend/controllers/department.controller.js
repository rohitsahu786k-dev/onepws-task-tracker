const Department = require('../models/Department');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const wid = (req) => req.params.wid || req.body.workspace || req.query.workspace;
const departmentId = (req) => req.params.departmentId || req.params.id;

const baseQuery = (req) => ({
  workspace: wid(req),
  isDeleted: req.query.includeDeleted === 'true' ? { $in: [true, false] } : { $ne: true }
});

const getAll = asyncHandler(async (req, res) => {
  const query = baseQuery(req);
  if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
  if (req.query.search) query.name = { $regex: req.query.search, $options: 'i' };
  const departments = await Department.find(query).populate('head members.user').sort({ name: 1 });
  res.json({ success: true, data: departments, departments });
});

const create = asyncHandler(async (req, res) => {
  const department = await Department.create({
    ...req.body,
    workspace: wid(req),
    code: req.body.code || String(req.body.name || '').slice(0, 3).toUpperCase(),
    createdBy: req.user._id
  });
  res.status(201).json({ success: true, message: 'Department created', data: department, department });
});

const getById = asyncHandler(async (req, res) => {
  const department = await Department.findOne({ _id: departmentId(req), ...baseQuery(req) }).populate('head members.user');
  if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
  res.json({ success: true, data: department, department });
});

const update = asyncHandler(async (req, res) => {
  const department = await Department.findOneAndUpdate(
    { _id: departmentId(req), ...baseQuery(req) },
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
  res.json({ success: true, message: 'Department updated', data: department, department });
});

const remove = asyncHandler(async (req, res) => {
  const department = await Department.findOne({ _id: departmentId(req), ...baseQuery(req) });
  if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
  if (department.isSystemDepartment) return res.status(400).json({ success: false, message: 'System department cannot be deleted' });
  department.isDeleted = true;
  department.isActive = false;
  department.deletedAt = new Date();
  department.deletedBy = req.user._id;
  await department.save();
  res.json({ success: true, message: 'Department deleted' });
});

const restore = asyncHandler(async (req, res) => {
  const department = await Department.findOne({ _id: departmentId(req), workspace: wid(req) });
  if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
  department.isDeleted = false;
  department.isActive = true;
  department.deletedAt = undefined;
  await department.save();
  res.json({ success: true, message: 'Department restored', data: department });
});

const setActive = (isActive) => asyncHandler(async (req, res) => {
  const department = await Department.findOneAndUpdate(
    { _id: departmentId(req), workspace: wid(req) },
    { isActive, updatedBy: req.user._id },
    { new: true }
  );
  if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
  res.json({ success: true, message: isActive ? 'Department activated' : 'Department deactivated', data: department });
});

const listMembers = asyncHandler(async (req, res) => {
  const department = await Department.findOne({ _id: departmentId(req), workspace: wid(req) }).populate('members.user');
  if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
  res.json({ success: true, data: department.members, members: department.members });
});

const addMember = asyncHandler(async (req, res) => {
  const department = await Department.findOne({ _id: departmentId(req), workspace: wid(req) });
  if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
  if (!department.members.some((item) => item.user?.toString() === req.body.userId)) {
    department.members.push({ user: req.body.userId, designation: req.body.designation, roleInDepartment: req.body.roleInDepartment || 'member', joinedAt: new Date() });
    await department.save();
  }
  await Workspace.updateOne(
    { _id: wid(req), 'members.user': req.body.userId },
    { $set: { 'members.$.department': department._id } }
  );
  const user = await User.findById(req.body.userId);
  const membership = user?.workspaces?.find((item) => item.workspace?.toString() === wid(req).toString());
  if (membership) {
    membership.department = department._id;
    await user.save({ validateBeforeSave: false });
  }
  res.json({ success: true, message: 'Department member added', data: department.members });
});

const removeMember = asyncHandler(async (req, res) => {
  const department = await Department.findOne({ _id: departmentId(req), workspace: wid(req) });
  if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
  department.members = department.members.filter((item) => item.user?.toString() !== req.params.userId);
  await department.save();
  res.json({ success: true, message: 'Department member removed' });
});

const setHead = asyncHandler(async (req, res) => {
  const department = await Department.findOneAndUpdate(
    { _id: departmentId(req), workspace: wid(req) },
    { head: req.body.userId || req.body.head, updatedBy: req.user._id },
    { new: true }
  );
  if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
  res.json({ success: true, message: 'Department head updated', data: department });
});

const setModules = asyncHandler(async (req, res) => {
  const department = await Department.findOneAndUpdate(
    { _id: departmentId(req), workspace: wid(req) },
    { allowedModules: req.body.allowedModules || req.body.modules || [], updatedBy: req.user._id },
    { new: true }
  );
  if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
  res.json({ success: true, message: 'Department modules updated', data: department });
});

const employees = asyncHandler(async (req, res) => {
  const EmployeeProfile = require('../models/EmployeeProfile');
  const items = await EmployeeProfile.find({ workspace: wid(req), department: departmentId(req), isDeleted: { $ne: true } })
    .populate('user designation reportingManager', 'name email title')
    .sort({ displayName: 1 });
  res.json({ success: true, data: items, employees: items });
});

const tree = asyncHandler(async (req, res) => {
  const departments = await Department.find({ workspace: wid(req), isDeleted: { $ne: true } }).sort({ order: 1, name: 1 });
  const byId = new Map(departments.map((dept) => [dept._id.toString(), { ...dept.toObject(), children: [] }]));
  const roots = [];
  byId.forEach((node) => {
    const parentId = node.parentDepartment?.toString();
    if (parentId && byId.has(parentId)) byId.get(parentId).children.push(node);
    else roots.push(node);
  });
  res.json({ success: true, data: roots, departments: roots });
});

const placeholderDashboard = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: { totalMembers: 0, openTasks: 0, overdueTasks: 0, reports: [] } });
});

module.exports = {
  getAll,
  list: getAll,
  create,
  getById,
  getOne: getById,
  update,
  remove,
  delete: remove,
  restore,
  activate: setActive(true),
  deactivate: setActive(false),
  listMembers,
  addMember,
  removeMember,
  setHead,
  setModules,
  employees,
  tree,
  getTasks: placeholderDashboard,
  getReports: placeholderDashboard,
  getDashboard: placeholderDashboard
};
