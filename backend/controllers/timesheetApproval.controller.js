const asyncHandler = require('../utils/asyncHandler');
const TimesheetApproval = require('../models/TimesheetApproval');

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
    TimesheetApproval.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    TimesheetApproval.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: items,
    timesheetApprovals: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

const create = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  const workspace = getWorkspaceId(req);
  if (workspace && !payload.workspace) payload.workspace = workspace;
  if (req.user?._id && !payload.createdBy) payload.createdBy = req.user._id;
  const item = await TimesheetApproval.create(payload);
  res.status(201).json({ success: true, data: item, timesheetApproval: item });
});

const getById = asyncHandler(async (req, res) => {
  const item = await TimesheetApproval.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'TimesheetApproval not found' });
  res.json({ success: true, data: item, timesheetApproval: item });
});

const update = asyncHandler(async (req, res) => {
  const item = await TimesheetApproval.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) return res.status(404).json({ success: false, message: 'TimesheetApproval not found' });
  res.json({ success: true, data: item, timesheetApproval: item });
});

const remove = asyncHandler(async (req, res) => {
  const item = await TimesheetApproval.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'TimesheetApproval not found' });
  await item.deleteOne();
  res.json({ success: true, message: 'TimesheetApproval deleted' });
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
};
