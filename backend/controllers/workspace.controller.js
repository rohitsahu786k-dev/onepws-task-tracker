const asyncHandler = require('../utils/asyncHandler');
const Workspace = require('../models/Workspace');

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
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const skip = (page - 1) * limit;
  const query = buildQuery(req);
  const [items, total] = await Promise.all([
    Workspace.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    Workspace.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: items,
    workspaces: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

const create = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  const workspace = getWorkspaceId(req);
  if (workspace && !payload.workspace) payload.workspace = workspace;
  if (req.user?._id && !payload.createdBy) payload.createdBy = req.user._id;
  const item = await Workspace.create(payload);
  res.status(201).json({ success: true, data: item, workspace: item });
});

const getById = asyncHandler(async (req, res) => {
  const item = await Workspace.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Workspace not found' });
  res.json({ success: true, data: item, workspace: item });
});

const update = asyncHandler(async (req, res) => {
  const item = await Workspace.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) return res.status(404).json({ success: false, message: 'Workspace not found' });
  res.json({ success: true, data: item, workspace: item });
});

const remove = asyncHandler(async (req, res) => {
  const item = await Workspace.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Workspace not found' });
  await item.deleteOne();
  res.json({ success: true, message: 'Workspace deleted' });
});

// Get user permissions for a workspace
const getPermissions = asyncHandler(async (req, res) => {
  const workspaceId = req.params.id;

  // Find user's role in this workspace from the authenticated user
  const userWorkspaces = req.user?.workspaces || [];
  const userWorkspaceRole = userWorkspaces.find(w =>
    w.workspace?.toString() === workspaceId || w.workspace === workspaceId
  );

  const role = userWorkspaceRole?.role || 'member';

  // Get permissions based on role
  let permissions = [];

  if (role === 'super_admin' || role === 'owner') {
    permissions = ['*'];
  } else if (role === 'admin') {
    permissions = [
      'dashboard:view', 'tasks:view', 'tasks:create', 'tasks:update', 'tasks:delete',
      'projects:view', 'projects:create', 'projects:update', 'projects:delete',
      'tracker:view', 'tracker:create', 'tracker:update', 'tracker:configure_fields',
      'media:view', 'media:upload', 'media:delete',
      'calendar:view', 'calendar:create', 'calendar:update',
      'meetings:view', 'meetings:create', 'meetings:update', 'meetings:delete',
      'mom:view', 'mom:create', 'mom:update', 'mom:sign',
      'reports:view', 'reports:export', 'reports:manage',
      'settings:view', 'settings:update', 'settings:update_roles', 'settings:update_integrations',
      'members:view', 'members:invite', 'members:update', 'members:remove',
      'budget:view', 'budget:create', 'budget:update', 'budget:approve',
      'expenses:view', 'expenses:create', 'expenses:approve',
      'timesheet:view', 'timesheet:create', 'timesheet:update',
      'notifications:view', 'notifications:manage',
      'intake:view', 'intake:create', 'intake:approve'
    ];
  } else if (role === 'manager') {
    permissions = [
      'dashboard:view', 'tasks:view', 'tasks:create', 'tasks:update',
      'projects:view', 'projects:create', 'projects:update',
      'tracker:view', 'tracker:create', 'tracker:update',
      'media:view', 'media:upload',
      'calendar:view', 'calendar:create',
      'meetings:view', 'meetings:create',
      'mom:view', 'mom:create',
      'reports:view', 'reports:export',
      'budget:view',
      'timesheet:view', 'timesheet:create', 'timesheet:update',
      'notifications:view'
    ];
  } else {
    // member
    permissions = [
      'dashboard:view', 'tasks:view', 'tasks:create', 'tasks:update',
      'projects:view',
      'tracker:view', 'tracker:create', 'tracker:update',
      'media:view', 'media:upload',
      'calendar:view',
      'meetings:view',
      'mom:view',
      'reports:view',
      'timesheet:view', 'timesheet:create',
      'notifications:view'
    ];
  }

  res.json({
    success: true,
    data: {
      workspaceRole: role,
      allowedModules: {},
      permissions
    }
  });
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
  getPermissions
};