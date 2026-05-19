const asyncHandler = require('../utils/asyncHandler');
const Designation = require('../models/Designation');

const workspaceId = (req) => req.params.wid || req.body.workspace || req.query.workspace || req.workspace?._id;
const designationId = (req) => req.params.designationId || req.params.id;

const list = asyncHandler(async (req, res) => {
  const query = { workspace: workspaceId(req) };
  if (req.query.department) query.department = req.query.department;
  if (req.query.active !== undefined) query.isActive = req.query.active === 'true';
  if (req.query.search) query.title = { $regex: req.query.search, $options: 'i' };
  const items = await Designation.find(query).populate('department', 'name code').sort({ level: 1, title: 1 });
  res.json({ success: true, data: items, designations: items });
});

const create = asyncHandler(async (req, res) => {
  const item = await Designation.create({ ...req.body, workspace: workspaceId(req), createdBy: req.user?._id });
  res.status(201).json({ success: true, data: item, designation: item });
});

const getById = asyncHandler(async (req, res) => {
  const item = await Designation.findOne({ _id: designationId(req), workspace: workspaceId(req) });
  if (!item) return res.status(404).json({ success: false, message: 'Designation not found' });
  res.json({ success: true, data: item, designation: item });
});

const update = asyncHandler(async (req, res) => {
  const item = await Designation.findOneAndUpdate({ _id: designationId(req), workspace: workspaceId(req) }, { ...req.body, updatedBy: req.user?._id }, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ success: false, message: 'Designation not found' });
  res.json({ success: true, data: item, designation: item });
});

const remove = asyncHandler(async (req, res) => {
  const item = await Designation.findOneAndDelete({ _id: designationId(req), workspace: workspaceId(req) });
  if (!item) return res.status(404).json({ success: false, message: 'Designation not found' });
  res.json({ success: true, message: 'Designation deleted' });
});

const setActive = (isActive) => asyncHandler(async (req, res) => {
  const item = await Designation.findOneAndUpdate({ _id: designationId(req), workspace: workspaceId(req) }, { isActive, updatedBy: req.user?._id }, { new: true });
  if (!item) return res.status(404).json({ success: false, message: 'Designation not found' });
  res.json({ success: true, data: item, designation: item });
});

module.exports = { list, getAll: list, create, getById, update, remove, delete: remove, activate: setActive(true), deactivate: setActive(false) };
