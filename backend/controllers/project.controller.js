const slugify = require('slugify');
const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
const ProjectActivity = require('../models/ProjectActivity');
const asyncHandler = require('../utils/asyncHandler');
const projectNumberService = require('../services/projectNumber.service');
const projectProgressService = require('../services/projectProgress.service');
const projectActivityService = require('../services/projectActivity.service');

const wid = (req) => req.params.wid || req.body.workspace || req.query.workspace;
const pid = (req) => req.params.projectId || req.params.id;

function canAccessProject(req, project) {
  if (req.user.globalRole === 'super_admin' || ['owner', 'admin', 'super_admin'].includes(req.workspaceRole)) return true;
  const userId = req.user._id.toString();
  const isManager = project.manager?.toString() === userId;
  const isMember = project.members?.some((item) => item.user?.toString() === userId);
  const isCreator = project.createdBy?.toString() === userId;
  const sameDepartment = project.owningDepartment?.toString() === req.workspaceDepartment?.toString();
  if (req.workspaceRole === 'manager' && (isManager || sameDepartment)) return true;
  if (req.workspaceRole === 'member' && (isMember || isCreator)) return true;
  if (req.workspaceRole === 'viewer' && project.visibility !== 'private') return true;
  return false;
}

const loadProject = async (req, res) => {
  const project = await Project.findOne({ _id: pid(req), workspace: wid(req), isDeleted: { $ne: true } });
  if (!project) {
    res.status(404).json({ success: false, message: 'Project not found' });
    return null;
  }
  if (!canAccessProject(req, project)) {
    res.status(403).json({ success: false, message: 'You do not have access to this project' });
    return null;
  }
  return project;
};

const buildQuery = (req) => {
  const query = { workspace: wid(req), isDeleted: { $ne: true } };
  if (req.query.archived === 'true') query.status = 'archived';
  else if (req.query.status) query.status = req.query.status;
  else if (req.query.includeArchived !== 'true') query.status = { $ne: 'archived' };
  if (req.query.priority) query.priority = req.query.priority;
  if (req.query.projectType) query.projectType = req.query.projectType;
  if (req.query.manager) query.manager = req.query.manager;
  if (req.query.department) query.$or = [{ requestingDepartment: req.query.department }, { owningDepartment: req.query.department }, { department: req.query.department }];
  if (req.query.search) {
    const search = new RegExp(req.query.search, 'i');
    query.$or = [
      { projectNumber: search },
      { projectCode: search },
      { title: search },
      { description: search },
      { tags: search }
    ];
  }
  return query;
};

const getAll = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const query = buildQuery(req);
  const [items, total] = await Promise.all([
    Project.find(query)
      .populate('manager members.user requestingDepartment owningDepartment')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Project.countDocuments(query)
  ]);
  const data = items.filter((project) => canAccessProject(req, project));
  res.json({ success: true, data, projects: data, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

const create = asyncHandler(async (req, res) => {
  const projectNumber = await projectNumberService.generateProjectNumber(wid(req));
  const projectCode = req.body.projectCode || await projectNumberService.generateProjectCode({ workspace: wid(req), title: req.body.title });
  const project = await Project.create({
    ...req.body,
    workspace: wid(req),
    projectNumber,
    projectCode,
    slug: slugify(req.body.title || projectCode, { lower: true, strict: true }),
    members: (req.body.members || []).map((item) => ({ ...item, addedAt: new Date(), addedBy: req.user._id })),
    createdBy: req.user._id
  });
  await projectActivityService.log({ workspace: wid(req), project: project._id, action: 'created', message: `Project ${project.projectNumber} created`, performedBy: req.user._id });
  res.status(201).json({ success: true, message: 'Project created successfully', data: project, project });
});

const getById = asyncHandler(async (req, res) => {
  const project = await loadProject(req, res);
  if (!project) return;
  await project.populate('manager members.user requestingDepartment owningDepartment linkedMediaFiles budget');
  res.json({ success: true, data: project, project });
});

const update = asyncHandler(async (req, res) => {
  const project = await loadProject(req, res);
  if (!project) return;
  const oldStatus = project.status;
  Object.assign(project, req.body, { updatedBy: req.user._id });
  if (req.body.title) project.slug = slugify(req.body.title, { lower: true, strict: true });
  await project.save();
  await projectActivityService.log({ workspace: wid(req), project: project._id, action: oldStatus !== project.status ? 'status_changed' : 'updated', message: `Project ${project.projectNumber} updated`, oldValue: oldStatus, newValue: project.status, performedBy: req.user._id });
  res.json({ success: true, message: 'Project updated', data: project, project });
});

const remove = asyncHandler(async (req, res) => {
  const project = await loadProject(req, res);
  if (!project) return;
  project.isDeleted = true;
  project.deletedAt = new Date();
  project.deletedBy = req.user._id;
  await project.save();
  await projectActivityService.log({ workspace: wid(req), project: project._id, action: 'deleted', message: `Project ${project.projectNumber} deleted`, performedBy: req.user._id });
  res.json({ success: true, message: 'Project deleted' });
});

const updateStatus = (status) => asyncHandler(async (req, res) => {
  const project = await loadProject(req, res);
  if (!project) return;
  if (status === 'on_hold' && !req.body.reason && !req.body.holdReason) return res.status(400).json({ success: false, message: 'Hold reason is required' });
  if (status === 'cancelled' && !req.body.reason && !req.body.cancellationReason) return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
  const oldStatus = project.status;
  project.status = status || req.body.status;
  if (project.status === 'completed') project.completedAt = new Date();
  if (project.status === 'cancelled') {
    project.cancelledAt = new Date();
    project.cancellationReason = req.body.reason || req.body.cancellationReason;
  }
  if (project.status === 'on_hold') project.holdReason = req.body.reason || req.body.holdReason;
  await project.save();
  await projectActivityService.log({ workspace: wid(req), project: project._id, action: project.status === 'archived' ? 'archived' : 'status_changed', message: `Project status changed from ${oldStatus} to ${project.status}`, oldValue: oldStatus, newValue: project.status, performedBy: req.user._id });
  res.json({ success: true, message: 'Project status updated', data: project });
});

const restore = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: pid(req), workspace: wid(req) });
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  project.isDeleted = false;
  if (project.status === 'archived') project.status = 'active';
  await project.save();
  res.json({ success: true, message: 'Project restored', data: project });
});

const dashboard = asyncHandler(async (req, res) => {
  const project = await loadProject(req, res);
  if (!project) return;
  const summary = await projectProgressService.recalculateProjectProgress(project._id);
  const daysRemaining = project.dueDate ? Math.ceil((new Date(project.dueDate) - new Date()) / 86400000) : null;
  res.json({ success: true, data: { ...summary, daysRemaining, budgetUsedPercent: project.estimatedBudget ? Math.round((project.actualSpend || 0) / project.estimatedBudget * 100) : 0 } });
});

const activity = asyncHandler(async (req, res) => {
  const project = await loadProject(req, res);
  if (!project) return;
  const items = await ProjectActivity.find({ project: project._id }).sort({ createdAt: -1 }).limit(100).populate('performedBy');
  res.json({ success: true, data: items, activity: items });
});

const report = asyncHandler(async (req, res) => {
  const project = await loadProject(req, res);
  if (!project) return;
  const milestones = await Milestone.find({ project: project._id, isDeleted: { $ne: true } });
  res.json({
    success: true,
    data: {
      projectNumber: project.projectNumber,
      title: project.title,
      type: project.projectType,
      status: project.status,
      priority: project.priority,
      progressPercent: project.progressPercent,
      taskSummary: project.taskSummary,
      milestoneSummary: project.milestoneSummary,
      estimatedBudget: project.estimatedBudget,
      actualSpend: project.actualSpend,
      milestones
    }
  });
});

const addMember = asyncHandler(async (req, res) => {
  const project = await loadProject(req, res);
  if (!project) return;
  if (!project.members.some((item) => item.user?.toString() === req.body.user)) {
    project.members.push({ ...req.body, addedAt: new Date(), addedBy: req.user._id });
    await project.save();
  }
  res.json({ success: true, message: 'Project member added', data: project.members });
});

const removeMember = asyncHandler(async (req, res) => {
  const project = await loadProject(req, res);
  if (!project) return;
  project.members = project.members.filter((item) => item.user?.toString() !== req.params.userId);
  await project.save();
  res.json({ success: true, message: 'Project member removed' });
});

const changeManager = asyncHandler(async (req, res) => {
  const project = await loadProject(req, res);
  if (!project) return;
  project.manager = req.body.manager || req.body.userId;
  await project.save();
  res.json({ success: true, message: 'Project manager updated', data: project });
});

const linkListField = (field) => asyncHandler(async (req, res) => {
  const project = await loadProject(req, res);
  if (!project) return;
  const value = req.body.mediaId || req.body.budgetId || req.body.id || req.body.refId;
  if (Array.isArray(project[field])) {
    if (!project[field].some((item) => item.toString() === value)) project[field].push(value);
  } else {
    project[field] = value;
  }
  await project.save();
  res.json({ success: true, message: 'Project link updated', data: project });
});

const unlinkListField = (field, param) => asyncHandler(async (req, res) => {
  const project = await loadProject(req, res);
  if (!project) return;
  if (Array.isArray(project[field])) project[field] = project[field].filter((item) => item.toString() !== req.params[param]);
  else project[field] = undefined;
  await project.save();
  res.json({ success: true, message: 'Project link removed', data: project });
});

const passthroughList = (field) => asyncHandler(async (req, res) => {
  const project = await loadProject(req, res);
  if (!project) return;
  res.json({ success: true, data: project[field] || [] });
});

const createTaskPlaceholder = asyncHandler(async (req, res) => {
  const project = await loadProject(req, res);
  if (!project) return;
  res.status(202).json({ success: true, message: 'Task creation from project is accepted by task module integration.', data: { project: project._id, payload: req.body } });
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
  updateStatus: updateStatus(null),
  hold: updateStatus('on_hold'),
  complete: updateStatus('completed'),
  cancel: updateStatus('cancelled'),
  archive: updateStatus('archived'),
  restore,
  dashboard,
  activity,
  report,
  addMember,
  removeMember,
  changeManager,
  getTasks: passthroughList('linkedTasks'),
  createTask: createTaskPlaceholder,
  getMeetings: passthroughList('linkedMeetings'),
  getMoms: passthroughList('linkedMOMs'),
  getMedia: passthroughList('linkedMediaFiles'),
  linkMedia: linkListField('linkedMediaFiles'),
  unlinkMedia: unlinkListField('linkedMediaFiles', 'mediaId'),
  linkBudget: linkListField('budget'),
  unlinkBudget: unlinkListField('budget', 'budgetId')
};
