const asyncHandler = require('../utils/asyncHandler');
const TaskStage = require('../models/TaskStage');
const Task = require('../models/Task');
const taskStageService = require('../services/taskStage.service');

const getWorkspaceId = (req) => req.params.wid || req.params.workspaceId || req.query.workspace || req.body.workspace;

const buildQuery = (req) => {
  const query = {};
  const workspace = getWorkspaceId(req);
  if (workspace) query.workspace = workspace;
  if (req.query.search) {
    const search = new RegExp(req.query.search, 'i');
    query.$or = ['name', 'title', 'email', 'status'].map((field) => ({ [field]: search }));
  }
  if (req.query.status) query.status = req.query.status;
  if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
  return query;
};

const getAll = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  if (workspace) await taskStageService.ensureDefaultStages(workspace, req.user?._id);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const skip = (page - 1) * limit;
  const query = buildQuery(req);
  const [items, total] = await Promise.all([
    TaskStage.find(query).sort({ order: 1, createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    TaskStage.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: items,
    taskStages: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

const create = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  const workspace = getWorkspaceId(req);
  if (workspace && !payload.workspace) payload.workspace = workspace;
  if (req.user?._id && !payload.createdBy) payload.createdBy = req.user._id;
  if (payload.isDefault) {
    await TaskStage.updateMany({ workspace: payload.workspace }, { isDefault: false });
  }
  const item = await TaskStage.create(payload);
  res.status(201).json({ success: true, data: item, taskStage: item });
});

const getById = asyncHandler(async (req, res) => {
  const item = await TaskStage.findById(req.params.stageId || req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'TaskStage not found' });
  res.json({ success: true, data: item, taskStage: item });
});

const update = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  if (req.body.isDefault) {
    await TaskStage.updateMany({ workspace, _id: { $ne: req.params.stageId || req.params.id } }, { isDefault: false });
  }
  const item = await TaskStage.findOneAndUpdate({ _id: req.params.stageId || req.params.id, ...(workspace ? { workspace } : {}) }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) return res.status(404).json({ success: false, message: 'TaskStage not found' });
  res.json({ success: true, data: item, taskStage: item });
});

const remove = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  const item = await TaskStage.findOne({ _id: req.params.stageId || req.params.id, ...(workspace ? { workspace } : {}) });
  if (!item) return res.status(404).json({ success: false, message: 'TaskStage not found' });
  const taskCount = await Task.countDocuments({ workspace: item.workspace, stage: item._id, isDeleted: { $ne: true } });
  if (taskCount && !req.body?.remapStage) {
    return res.status(409).json({ success: false, message: 'Stage has tasks. Provide remapStage before deleting.' });
  }
  if (taskCount && req.body.remapStage) {
    await Task.updateMany({ workspace: item.workspace, stage: item._id }, { stage: req.body.remapStage });
  }
  if (item.isSystem) {
    item.isActive = false;
    await item.save();
  } else {
    await item.deleteOne();
  }
  res.json({ success: true, message: 'TaskStage deleted' });
});

const reorder = asyncHandler(async (req, res) => {
  const workspace = getWorkspaceId(req);
  const stages = req.body.stages || [];
  await Promise.all(
    stages.map((stage, index) =>
      TaskStage.updateOne(
        { _id: stage._id || stage.stageId, workspace },
        { order: stage.order ?? index + 1 }
      )
    )
  );
  const items = await TaskStage.find({ workspace }).sort({ order: 1 });
  res.json({ success: true, data: items, taskStages: items });
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
  reorder,
};
