const asyncHandler = require('../utils/asyncHandler');
const EmailTemplate = require('../models/EmailTemplate');
const emailService = require('../services/email.service');

const getAll = asyncHandler(async (req, res) => {
  const templates = await EmailTemplate.find({ workspace: req.params.wid }).sort({ event: 1, name: 1 });
  res.json({ success: true, data: templates });
});

const create = asyncHandler(async (req, res) => {
  const template = await EmailTemplate.create({
    ...req.body,
    workspace: req.params.wid,
    createdBy: req.user._id,
    updatedBy: req.user._id
  });
  res.status(201).json({ success: true, data: template });
});

const update = asyncHandler(async (req, res) => {
  const template = await EmailTemplate.findOneAndUpdate(
    { _id: req.params.id, workspace: req.params.wid },
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!template) return res.status(404).json({ success: false, message: 'Email template not found' });
  res.json({ success: true, data: template });
});

const remove = asyncHandler(async (req, res) => {
  const template = await EmailTemplate.findOneAndDelete({ _id: req.params.id, workspace: req.params.wid });
  if (!template) return res.status(404).json({ success: false, message: 'Email template not found' });
  res.json({ success: true, message: 'Email template deleted' });
});

const sendTest = asyncHandler(async (req, res) => {
  const result = await emailService.sendTestEmail({
    workspace: req.params.wid,
    to: req.body.to || req.user.email,
    subject: req.body.subject,
    message: req.body.message
  });
  res.json({ success: true, data: result });
});

module.exports = { getAll, create, update, remove, sendTest };
