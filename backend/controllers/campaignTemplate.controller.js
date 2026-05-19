const asyncHandler = require('../utils/asyncHandler');
const CampaignTemplate = require('../models/CampaignTemplate');
const Campaign = require('../models/Campaign');
const ContentItem = require('../models/ContentItem');
const campaignNumberService = require('../services/campaignNumber.service');
const contentItemService = require('../services/contentItem.service');

const workspaceId = (req) => req.workspace._id;
const templateId = (req) => req.params.templateId || req.params.id;

const getAll = asyncHandler(async (req, res) => {
  const templates = await CampaignTemplate.find({ workspace: workspaceId(req), isActive: { $ne: false } }).sort({ isDefault: -1, createdAt: -1 });
  res.json({ success: true, data: templates, templates });
});

const create = asyncHandler(async (req, res) => {
  const template = await CampaignTemplate.create({ ...req.body, workspace: workspaceId(req), createdBy: req.user._id });
  res.status(201).json({ success: true, data: template, template });
});

const getById = asyncHandler(async (req, res) => {
  const template = await CampaignTemplate.findOne({ _id: templateId(req), workspace: workspaceId(req) });
  if (!template) return res.status(404).json({ success: false, message: 'Campaign template not found' });
  res.json({ success: true, data: template, template });
});

const update = asyncHandler(async (req, res) => {
  const template = await CampaignTemplate.findOneAndUpdate({ _id: templateId(req), workspace: workspaceId(req) }, req.body, { new: true, runValidators: true });
  if (!template) return res.status(404).json({ success: false, message: 'Campaign template not found' });
  res.json({ success: true, data: template, template });
});

const remove = asyncHandler(async (req, res) => {
  const template = await CampaignTemplate.findOneAndUpdate({ _id: templateId(req), workspace: workspaceId(req) }, { isActive: false }, { new: true });
  if (!template) return res.status(404).json({ success: false, message: 'Campaign template not found' });
  res.json({ success: true, message: 'Campaign template deleted', data: template });
});

const clone = asyncHandler(async (req, res) => {
  const source = await CampaignTemplate.findOne({ _id: templateId(req), workspace: workspaceId(req) }).lean();
  if (!source) return res.status(404).json({ success: false, message: 'Campaign template not found' });
  delete source._id;
  delete source.createdAt;
  delete source.updatedAt;
  const template = await CampaignTemplate.create({ ...source, name: req.body.name || `${source.name} Copy`, isDefault: false, createdBy: req.user._id });
  res.status(201).json({ success: true, data: template, template });
});

const setDefault = asyncHandler(async (req, res) => {
  await CampaignTemplate.updateMany({ workspace: workspaceId(req) }, { isDefault: false });
  const template = await CampaignTemplate.findOneAndUpdate({ _id: templateId(req), workspace: workspaceId(req) }, { isDefault: true }, { new: true });
  if (!template) return res.status(404).json({ success: false, message: 'Campaign template not found' });
  res.json({ success: true, data: template, template });
});

const createCampaign = asyncHandler(async (req, res) => {
  const template = await CampaignTemplate.findOne({ _id: templateId(req), workspace: workspaceId(req) });
  if (!template) return res.status(404).json({ success: false, message: 'Campaign template not found' });

  const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
  const endDate = req.body.endDate ? new Date(req.body.endDate) : new Date(startDate.getTime() + Number(template.defaultDurationDays || 30) * 86400000);
  const campaign = await Campaign.create({
    workspace: workspaceId(req),
    campaignNumber: await campaignNumberService.generateCampaignNumber(workspaceId(req)),
    name: req.body.name || template.name,
    campaignType: template.campaignType || 'other',
    objective: req.body.objective || template.defaultObjective,
    platforms: req.body.platforms || template.defaultPlatforms,
    startDate,
    endDate,
    owner: req.body.owner || req.user._id,
    kpis: template.defaultKpis,
    status: 'draft',
    createdBy: req.user._id
  });

  const items = [];
  for (const item of template.defaultContentItems || []) {
    const scheduledDate = new Date(startDate.getTime() + Number(item.offsetDays || 0) * 86400000);
    items.push(await contentItemService.createContentItem({
      workspace: workspaceId(req),
      campaign: campaign._id,
      title: item.title,
      contentType: item.contentType,
      platforms: item.platforms,
      scheduledDate,
      brief: item.brief
    }, req.user));
  }

  res.status(201).json({ success: true, data: { campaign, contentItems: items } });
});

module.exports = { getAll, create, getById, update, remove, clone, setDefault, createCampaign };
