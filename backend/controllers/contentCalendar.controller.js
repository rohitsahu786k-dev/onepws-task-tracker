const asyncHandler = require('../utils/asyncHandler');
const ContentItem = require('../models/ContentItem');

const workspaceId = (req) => req.workspace._id;

function calendarQuery(req) {
  const query = { workspace: workspaceId(req), isDeleted: { $ne: true } };
  if (req.query.startDate || req.query.endDate) {
    query.scheduledDate = {};
    if (req.query.startDate) query.scheduledDate.$gte = new Date(req.query.startDate);
    if (req.query.endDate) query.scheduledDate.$lte = new Date(req.query.endDate);
  }
  if (req.query.campaign) query.campaign = req.query.campaign;
  if (req.query.platform) query.platforms = req.query.platform;
  if (req.query.contentType) query.contentType = req.query.contentType;
  if (req.query.status) query.status = req.query.status;
  if (req.query.owner) query.contentOwner = req.query.owner;
  if (req.query.assignedTo) query.assignedTo = req.query.assignedTo;
  if (req.query.approvalStatus) query['approval.status'] = req.query.approvalStatus;
  return query;
}

const getAll = asyncHandler(async (req, res) => {
  const items = await ContentItem.find(calendarQuery(req)).populate('campaign assignedTo publisher').sort({ scheduledDate: 1 });
  res.json({ success: true, data: items, contentItems: items });
});

const month = getAll;
const week = getAll;
const list = getAll;
const platform = asyncHandler(async (req, res) => {
  req.query.platform = req.params.platform;
  return getAll(req, res);
});
const campaign = asyncHandler(async (req, res) => {
  req.query.campaign = req.params.campaignId;
  return getAll(req, res);
});

module.exports = { getAll, month, week, list, platform, campaign };
