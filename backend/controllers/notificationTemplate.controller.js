const asyncHandler = require('../utils/asyncHandler');
const NotificationTemplate = require('../models/NotificationTemplate');

const getAll = asyncHandler(async (req, res) => {
  const query = { workspace: req.params.wid };
  if (req.query.channel) query.channel = req.query.channel;
  if (req.query.event) query.event = req.query.event;

  const templates = await NotificationTemplate.find(query).sort({ event: 1, channel: 1 });
  res.json({ success: true, data: templates });
});

const create = asyncHandler(async (req, res) => {
  const template = await NotificationTemplate.create({
    ...req.body,
    workspace: req.params.wid,
    createdBy: req.user._id,
    updatedBy: req.user._id
  });
  res.status(201).json({ success: true, data: template });
});

const update = asyncHandler(async (req, res) => {
  const template = await NotificationTemplate.findOneAndUpdate(
    { _id: req.params.id, workspace: req.params.wid },
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!template) return res.status(404).json({ success: false, message: 'Notification template not found' });
  res.json({ success: true, data: template });
});

const remove = asyncHandler(async (req, res) => {
  const template = await NotificationTemplate.findOneAndDelete({ _id: req.params.id, workspace: req.params.wid });
  if (!template) return res.status(404).json({ success: false, message: 'Notification template not found' });
  res.json({ success: true, message: 'Notification template deleted' });
});

module.exports = { getAll, create, update, remove };
