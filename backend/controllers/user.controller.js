const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

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
    User.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: items,
    users: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

const create = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  const workspace = getWorkspaceId(req);
  if (workspace && !payload.workspace) payload.workspace = workspace;
  if (req.user?._id && !payload.createdBy) payload.createdBy = req.user._id;
  const item = await User.create(payload);
  res.status(201).json({ success: true, data: item, user: item });
});

const getById = asyncHandler(async (req, res) => {
  const item = await User.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: item, user: item });
});

const update = asyncHandler(async (req, res) => {
  const item = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: item, user: item });
});

const remove = asyncHandler(async (req, res) => {
  const item = await User.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'User not found' });
  await item.deleteOne();
  res.json({ success: true, message: 'User deleted' });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user, user: req.user });
});

const updateMe = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'avatar', 'designation', 'employeeCode', 'jd', 'bio', 'preferences', 'notificationPreferences', 'themePreference'];
  const update = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) update[field] = req.body[field];
  });
  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
  res.json({ success: true, message: 'Profile updated', data: user, user });
});

const uploadAvatar = asyncHandler(async (req, res) => {
  const avatar = req.file ? `/uploads/avatars/${req.file.filename}` : req.body.avatar;
  const user = await User.findByIdAndUpdate(req.user._id, { avatar }, { new: true });
  res.json({ success: true, message: 'Avatar updated', data: user, user });
});

const deleteAvatar = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { $unset: { avatar: 1 } }, { new: true });
  res.json({ success: true, message: 'Avatar removed', data: user, user });
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
  getMe,
  updateMe,
  uploadAvatar,
  deleteAvatar
};
