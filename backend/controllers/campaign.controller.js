const slugify = require('slugify');
const asyncHandler = require('../utils/asyncHandler');
const Campaign = require('../models/Campaign');
const ContentItem = require('../models/ContentItem');
const campaignNumberService = require('../services/campaignNumber.service');
const campaignActivityService = require('../services/campaignActivity.service');
const campaignService = require('../services/campaign.service');
const campaignReportService = require('../services/campaignReport.service');

const workspaceId = (req) => req.workspace._id;
const campaignId = (req) => req.params.campaignId || req.params.id;

function buildQuery(req) {
  const query = { workspace: workspaceId(req), isDeleted: { $ne: true } };
  if (req.query.status) query.status = req.query.status;
  if (req.query.campaignType) query.campaignType = req.query.campaignType;
  if (req.query.owner) query.owner = req.query.owner;
  if (req.query.department) query.department = req.query.department;
  if (req.query.project) query.project = req.query.project;
  if (req.query.search) {
    const search = new RegExp(req.query.search, 'i');
    query.$or = [{ campaignNumber: search }, { name: search }, { description: search }, { objective: search }, { tags: search }];
  }
  return query;
}

async function getCampaignOr404(req, res) {
  const campaign = await Campaign.findOne({ _id: campaignId(req), workspace: workspaceId(req), isDeleted: { $ne: true } });
  if (!campaign) {
    res.status(404).json({ success: false, message: 'Campaign not found' });
    return null;
  }
  return campaign;
}

const getAll = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const skip = (page - 1) * limit;
  const query = buildQuery(req);
  const [items, total] = await Promise.all([
    Campaign.find(query).populate('owner manager department project budget').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Campaign.countDocuments(query)
  ]);
  res.json({ success: true, data: items, campaigns: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

const create = asyncHandler(async (req, res) => {
  if (new Date(req.body.endDate) < new Date(req.body.startDate)) {
    return res.status(400).json({ success: false, message: 'Campaign end date must be after start date' });
  }

  const campaign = await Campaign.create({
    ...req.body,
    workspace: workspaceId(req),
    campaignNumber: req.body.campaignNumber || await campaignNumberService.generateCampaignNumber(workspaceId(req)),
    slug: req.body.slug || slugify(req.body.name || 'campaign', { lower: true, strict: true }),
    owner: req.body.owner || req.user._id,
    status: req.body.status || 'draft',
    createdBy: req.user._id,
    updatedBy: req.user._id
  });

  await campaignActivityService.log({
    workspace: workspaceId(req),
    campaign: campaign._id,
    action: 'campaign_created',
    message: `Campaign ${campaign.campaignNumber} created`,
    performedBy: req.user._id
  });

  res.status(201).json({ success: true, message: 'Campaign created successfully', data: campaign, campaign });
});

const getById = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOne({ _id: campaignId(req), workspace: workspaceId(req), isDeleted: { $ne: true } })
    .populate('owner manager teamMembers.user department project budget');
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
  const contentItems = await ContentItem.find({ workspace: workspaceId(req), campaign: campaign._id, isDeleted: { $ne: true } }).sort({ scheduledDate: 1 });
  res.json({ success: true, data: { ...campaign.toObject(), contentItems }, campaign: { ...campaign.toObject(), contentItems } });
});

const update = asyncHandler(async (req, res) => {
  const campaign = await getCampaignOr404(req, res);
  if (!campaign) return;
  Object.assign(campaign, req.body, { updatedBy: req.user._id });
  if (req.body.name) campaign.slug = req.body.slug || slugify(req.body.name, { lower: true, strict: true });
  await campaign.save();
  await campaignActivityService.log({ workspace: workspaceId(req), campaign: campaign._id, action: 'campaign_updated', message: 'Campaign updated', performedBy: req.user._id });
  res.json({ success: true, data: campaign, campaign });
});

const remove = asyncHandler(async (req, res) => {
  const campaign = await getCampaignOr404(req, res);
  if (!campaign) return;
  campaign.isDeleted = true;
  campaign.deletedAt = new Date();
  campaign.deletedBy = req.user._id;
  await campaign.save();
  res.json({ success: true, message: 'Campaign deleted' });
});

function statusPatch(status, action) {
  return asyncHandler(async (req, res) => {
    const campaign = await getCampaignOr404(req, res);
    if (!campaign) return;
    const oldStatus = campaign.status;
    campaign.status = status;
    campaign.updatedBy = req.user._id;
    await campaign.save();
    await campaignActivityService.log({ workspace: workspaceId(req), campaign: campaign._id, action, message: `Campaign ${status}`, oldValue: oldStatus, newValue: status, performedBy: req.user._id });
    res.json({ success: true, data: campaign, campaign });
  });
}

const listContentItems = asyncHandler(async (req, res) => {
  const items = await ContentItem.find({ workspace: workspaceId(req), campaign: campaignId(req), isDeleted: { $ne: true } }).sort({ scheduledDate: 1 });
  res.json({ success: true, data: items, contentItems: items });
});

const performance = asyncHandler(async (req, res) => {
  const data = await campaignService.recalculateCampaignPerformance(campaignId(req));
  res.json({ success: true, data });
});

const dashboard = asyncHandler(async (req, res) => {
  const data = await campaignReportService.getDashboard(workspaceId(req));
  res.json({ success: true, data });
});

const reports = asyncHandler(async (req, res) => {
  const campaigns = await Campaign.find(buildQuery(req)).lean();
  res.json({ success: true, data: campaigns });
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
  plan: statusPatch('planned', 'campaign_updated'),
  start: statusPatch('active', 'campaign_started'),
  hold: statusPatch('on_hold', 'campaign_updated'),
  complete: statusPatch('completed', 'campaign_completed'),
  cancel: statusPatch('cancelled', 'campaign_cancelled'),
  archive: statusPatch('archived', 'campaign_updated'),
  restore: statusPatch('draft', 'campaign_updated'),
  listContentItems,
  performance,
  dashboard,
  reports,
  report: reports
};
