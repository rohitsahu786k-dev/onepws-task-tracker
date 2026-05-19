const asyncHandler = require('../utils/asyncHandler');
const PrintJobTemplate = require('../models/PrintJobTemplate');

const workspaceId = (req) => req.workspace._id;

const getAll = asyncHandler(async (req, res) => {
  const templates = await PrintJobTemplate.find({ workspace: workspaceId(req), isActive: { $ne: false } }).sort({ isDefault: -1, createdAt: -1 });
  res.json({ success: true, data: templates, templates });
});

const create = asyncHandler(async (req, res) => {
  const template = await PrintJobTemplate.create({ ...req.body, workspace: workspaceId(req), createdBy: req.user._id });
  res.status(201).json({ success: true, data: template, template });
});

module.exports = { getAll, create };
