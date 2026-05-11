const asyncHandler = require('../utils/asyncHandler');
const Task = require('../models/Task');
const { syncTaskEvent, cancelTaskEvent } = require('../services/calendar.service');

const getAll = asyncHandler(async (req, res) => {
  const query = {};
  if (req.params.wid || req.query.workspace) query.workspace = req.params.wid || req.query.workspace;
  if (req.query.status) query.status = req.query.status;
  if (req.query.assignedTo) query.assignedTo = req.query.assignedTo;

  if (req.workspaceRole === 'manager') {
    query.$or = [
      { requestedByDepartment: req.workspaceDepartment },
      { assignedTo: req.user._id },
      { createdBy: req.user._id },
      { watchers: req.user._id }
    ];
  } else if (req.workspaceRole === 'member') {
    query.$or = [{ assignedTo: req.user._id }, { createdBy: req.user._id }, { watchers: req.user._id }];
  } else if (req.workspaceRole === 'viewer') {
    query.visibility = { $ne: 'private' };
  }

  const tasks = await Task.find(query).sort({ dueDate: 1, createdAt: -1 });
  res.json({ success: true, tasks, data: tasks });
});

const create = asyncHandler(async (req, res) => {
  const workspaceId = req.params.wid || req.body.workspace;
  const task = await Task.create({
    ...req.body,
    workspace: workspaceId,
    createdBy: req.user._id,
  });

  await syncTaskEvent(task);
  res.status(201).json({ success: true, task, data: task });
});

const getById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  res.json({ success: true, task, data: task });
});

const update = asyncHandler(async (req, res) => {
  const task = req.task
    ? await Task.findByIdAndUpdate(req.task._id, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true })
    : await Task.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  await syncTaskEvent(task);
  res.json({ success: true, task, data: task });
});

const updateStatus = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndUpdate(
    req.task?._id || req.params.id,
    { status: req.body.status, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  await syncTaskEvent(task);
  res.json({ success: true, task, data: task });
});

const remove = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  await cancelTaskEvent(task, 'Task deleted');
  await task.deleteOne();
  res.json({ success: true, message: 'Task deleted' });
});

module.exports = {
  getAll,
  create,
  getById,
  update,
  updateStatus,
  remove,
};
