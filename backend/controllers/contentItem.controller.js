const asyncHandler = require('../utils/asyncHandler');
const ContentItem = require('../models/ContentItem');
const contentItemService = require('../services/contentItem.service');
const contentCalendarService = require('../services/contentCalendar.service');
const contentPerformanceService = require('../services/contentPerformance.service');
const campaignActivityService = require('../services/campaignActivity.service');
const campaignService = require('../services/campaign.service');

const workspaceId = (req) => req.workspace._id;
const contentId = (req) => req.params.contentId || req.params.id;

function buildQuery(req) {
  const query = { workspace: workspaceId(req), isDeleted: { $ne: true } };
  if (req.query.campaign) query.campaign = req.query.campaign;
  if (req.query.status) query.status = req.query.status;
  if (req.query.contentType) query.contentType = req.query.contentType;
  if (req.query.platform) query.platforms = req.query.platform;
  if (req.query.assignedTo) query.assignedTo = req.query.assignedTo;
  if (req.query.startDate || req.query.endDate) {
    query.scheduledDate = {};
    if (req.query.startDate) query.scheduledDate.$gte = new Date(req.query.startDate);
    if (req.query.endDate) query.scheduledDate.$lte = new Date(req.query.endDate);
  }
  if (req.query.search) {
    const search = new RegExp(req.query.search, 'i');
    query.$or = [{ contentNumber: search }, { title: search }, { brief: search }, { caption: search }, { tags: search }];
  }
  return query;
}

async function getContentOr404(req, res) {
  const contentItem = await ContentItem.findOne({ _id: contentId(req), workspace: workspaceId(req), isDeleted: { $ne: true } });
  if (!contentItem) {
    res.status(404).json({ success: false, message: 'Content item not found' });
    return null;
  }
  return contentItem;
}

const getAll = asyncHandler(async (req, res) => {
  const items = await ContentItem.find(buildQuery(req)).populate('campaign assignedTo designer contentWriter approver publisher').sort({ scheduledDate: 1, createdAt: -1 });
  res.json({ success: true, data: items, contentItems: items });
});

const create = asyncHandler(async (req, res) => {
  const contentItem = await contentItemService.createContentItem({ ...req.body, workspace: workspaceId(req) }, req.user);
  await campaignActivityService.log({ workspace: workspaceId(req), campaign: contentItem.campaign, contentItem: contentItem._id, action: 'content_created', message: `Content item ${contentItem.contentNumber} created`, performedBy: req.user._id });
  res.status(201).json({ success: true, message: 'Content item created successfully', data: contentItem, contentItem });
});

const getById = asyncHandler(async (req, res) => {
  const contentItem = await ContentItem.findOne({ _id: contentId(req), workspace: workspaceId(req), isDeleted: { $ne: true } }).populate('campaign assignedTo designer contentWriter approver publisher task linkedTasks');
  if (!contentItem) return res.status(404).json({ success: false, message: 'Content item not found' });
  res.json({ success: true, data: contentItem, contentItem });
});

const update = asyncHandler(async (req, res) => {
  const contentItem = await getContentOr404(req, res);
  if (!contentItem) return;
  Object.assign(contentItem, req.body, { updatedBy: req.user._id });
  if (req.body.scheduledDate || req.body.scheduledTime) {
    contentItem.publishDateTime = contentCalendarService.buildPublishDateTime(contentItem.scheduledDate, contentItem.scheduledTime);
  }
  await contentItem.save();
  await contentCalendarService.updateCalendarEvent(contentItem);
  await campaignActivityService.log({ workspace: workspaceId(req), campaign: contentItem.campaign, contentItem: contentItem._id, action: 'content_updated', message: 'Content item updated', performedBy: req.user._id });
  res.json({ success: true, data: contentItem, contentItem });
});

const remove = asyncHandler(async (req, res) => {
  const contentItem = await getContentOr404(req, res);
  if (!contentItem) return;
  contentItem.isDeleted = true;
  contentItem.deletedAt = new Date();
  contentItem.deletedBy = req.user._id;
  await contentItem.save();
  res.json({ success: true, message: 'Content item deleted' });
});

const updateStatus = asyncHandler(async (req, res) => {
  const contentItem = await getContentOr404(req, res);
  if (!contentItem) return;
  contentItem.status = req.body.status;
  contentItem.updatedBy = req.user._id;
  await contentItem.save();
  await contentCalendarService.updateCalendarEvent(contentItem);
  res.json({ success: true, data: contentItem, contentItem });
});

const schedule = asyncHandler(async (req, res) => {
  const contentItem = await getContentOr404(req, res);
  if (!contentItem) return;
  contentItem.scheduledDate = req.body.scheduledDate || contentItem.scheduledDate;
  contentItem.scheduledTime = req.body.scheduledTime ?? contentItem.scheduledTime;
  contentItem.publishDateTime = contentCalendarService.buildPublishDateTime(contentItem.scheduledDate, contentItem.scheduledTime);
  contentItem.status = 'scheduled';
  await contentItem.save();
  await contentCalendarService.updateCalendarEvent(contentItem);
  res.json({ success: true, message: 'Content scheduled', data: contentItem, contentItem });
});

const publish = asyncHandler(async (req, res) => {
  const contentItem = await getContentOr404(req, res);
  if (!contentItem) return;
  if (!['approved', 'scheduled'].includes(contentItem.status)) {
    return res.status(400).json({ success: false, message: 'Only approved or scheduled content can be published' });
  }
  contentItem.status = 'published';
  contentItem.publishedLinks = req.body.publishedLinks || contentItem.publishedLinks || [];
  contentItem.notes = req.body.notes || contentItem.notes;
  await contentItem.save();
  await contentCalendarService.updateCalendarEvent(contentItem);
  await campaignActivityService.log({ workspace: workspaceId(req), campaign: contentItem.campaign, contentItem: contentItem._id, action: 'content_published', message: `${contentItem.title} marked as published`, performedBy: req.user._id });
  await campaignService.recalculateCampaignPerformance(contentItem.campaign);
  res.json({ success: true, message: 'Content marked as published', data: contentItem, contentItem });
});

const updatePerformance = asyncHandler(async (req, res) => {
  const contentItem = await getContentOr404(req, res);
  if (!contentItem) return;
  const performance = { ...(contentItem.performance?.toObject?.() || contentItem.performance || {}), ...req.body };
  performance.engagementRate = contentPerformanceService.calculateEngagementRate(performance);
  contentItem.performance = performance;
  await contentItem.save();
  await campaignService.recalculateCampaignPerformance(contentItem.campaign);
  await campaignActivityService.log({ workspace: workspaceId(req), campaign: contentItem.campaign, contentItem: contentItem._id, action: 'performance_updated', message: 'Content performance updated', performedBy: req.user._id });
  res.json({ success: true, message: 'Content performance updated', data: contentItem, contentItem });
});

module.exports = {
  getAll,
  create,
  getById,
  update,
  remove,
  updateStatus,
  schedule,
  publish,
  cancel: updateStatus,
  archive: updateStatus,
  restore: updateStatus,
  updatePerformance,
  getPerformance: getById
};
