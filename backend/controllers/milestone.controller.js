const Milestone = require('../models/Milestone');
const asyncHandler = require('../utils/asyncHandler');
const projectProgressService = require('../services/projectProgress.service');
const projectActivityService = require('../services/projectActivity.service');

const wid = (req) => req.params.wid || req.body.workspace || req.query.workspace;
const pid = (req) => req.params.projectId || req.body.project || req.query.project;
const mid = (req) => req.params.milestoneId || req.params.id;

const getAll = asyncHandler(async (req, res) => {
  const query = { workspace: wid(req), project: pid(req), isDeleted: { $ne: true } };
  if (req.query.status) query.status = req.query.status;
  const milestones = await Milestone.find(query).populate('responsiblePerson linkedTasks').sort({ order: 1, dueDate: 1 });
  res.json({ success: true, data: milestones, milestones });
});

const create = asyncHandler(async (req, res) => {
  const count = await Milestone.countDocuments({ workspace: wid(req), project: pid(req), isDeleted: { $ne: true } });
  const milestone = await Milestone.create({
    ...req.body,
    workspace: wid(req),
    project: pid(req),
    milestoneNumber: count + 1,
    order: req.body.order ?? count + 1,
    createdBy: req.user._id
  });
  await projectProgressService.recalculateProjectProgress(pid(req));
  await projectActivityService.log({ workspace: wid(req), project: pid(req), action: 'milestone_added', message: `Milestone ${milestone.title} added`, performedBy: req.user._id });
  res.status(201).json({ success: true, message: 'Milestone created', data: milestone, milestone });
});

const getById = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findOne({ _id: mid(req), workspace: wid(req), project: pid(req), isDeleted: { $ne: true } });
  if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });
  res.json({ success: true, data: milestone, milestone });
});

const update = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findOneAndUpdate(
    { _id: mid(req), workspace: wid(req), project: pid(req), isDeleted: { $ne: true } },
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });
  await projectProgressService.recalculateProjectProgress(pid(req));
  res.json({ success: true, message: 'Milestone updated', data: milestone, milestone });
});

const remove = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findOne({ _id: mid(req), workspace: wid(req), project: pid(req) });
  if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });
  milestone.isDeleted = true;
  milestone.deletedAt = new Date();
  milestone.deletedBy = req.user._id;
  await milestone.save();
  await projectProgressService.recalculateProjectProgress(pid(req));
  res.json({ success: true, message: 'Milestone deleted' });
});

const updateStatus = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findOne({ _id: mid(req), workspace: wid(req), project: pid(req), isDeleted: { $ne: true } });
  if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });
  milestone.status = req.body.status;
  if (milestone.status === 'completed') milestone.completedAt = new Date();
  if (milestone.status === 'delayed' && milestone.dueDate) milestone.delayDays = Math.max(0, Math.ceil((Date.now() - new Date(milestone.dueDate)) / 86400000));
  await milestone.save();
  await projectProgressService.recalculateProjectProgress(pid(req));
  if (milestone.status === 'completed') {
    await projectActivityService.log({ workspace: wid(req), project: pid(req), action: 'milestone_completed', message: `Milestone ${milestone.title} completed`, performedBy: req.user._id });
  }
  res.json({ success: true, message: 'Milestone status updated', data: milestone });
});

const complete = asyncHandler(async (req, res, next) => {
  req.body.status = 'completed';
  return updateStatus(req, res, next);
});

const reorder = asyncHandler(async (req, res) => {
  const updates = req.body.milestones || [];
  await Promise.all(updates.map((item) => Milestone.updateOne({ _id: item._id, workspace: wid(req), project: pid(req) }, { order: item.order })));
  res.json({ success: true, message: 'Milestones reordered' });
});

const linkTask = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findOne({ _id: mid(req), workspace: wid(req), project: pid(req), isDeleted: { $ne: true } });
  if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });
  const taskId = req.body.taskId;
  if (!milestone.linkedTasks.some((item) => item.toString() === taskId)) milestone.linkedTasks.push(taskId);
  await milestone.save();
  res.json({ success: true, message: 'Task linked', data: milestone });
});

const unlinkTask = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findOne({ _id: mid(req), workspace: wid(req), project: pid(req), isDeleted: { $ne: true } });
  if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });
  milestone.linkedTasks = milestone.linkedTasks.filter((item) => item.toString() !== req.params.taskId);
  await milestone.save();
  res.json({ success: true, message: 'Task unlinked', data: milestone });
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
  updateStatus,
  complete,
  reorder,
  linkTask,
  unlinkTask
};
