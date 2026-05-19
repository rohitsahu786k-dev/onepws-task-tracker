const asyncHandler = require('../utils/asyncHandler');
const WebhookDelivery = require('../models/WebhookDelivery');
const Webhook = require('../models/Webhook');
const IntegrationActivity = require('../models/IntegrationActivity');
const { deliverWebhook } = require('../services/webhookDelivery.service');
const integrationActivityService = require('../services/integrationActivity.service');

const getWid = (req) => req.params.wid || req.query.workspace || req.body.workspace;

// ─────────────────────────────────────────────
// GET /api/workspaces/:wid/webhook-deliveries
// ─────────────────────────────────────────────
const listDeliveries = asyncHandler(async (req, res) => {
  const workspace = getWid(req);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const skip = (page - 1) * limit;

  const query = { workspace };
  if (req.query.status) query.status = req.query.status;
  if (req.query.event) query.event = req.query.event;
  if (req.query.webhook) query.webhook = req.query.webhook;

  const [items, total] = await Promise.all([
    WebhookDelivery.find(query)
      .populate('webhook', 'name url')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    WebhookDelivery.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// ─────────────────────────────────────────────
// GET /api/workspaces/:wid/webhook-deliveries/:deliveryId
// ─────────────────────────────────────────────
const getDelivery = asyncHandler(async (req, res) => {
  const item = await WebhookDelivery.findOne({
    _id: req.params.deliveryId,
    workspace: getWid(req),
  }).populate('webhook', 'name url status');

  if (!item) {
    return res.status(404).json({ success: false, message: 'Delivery not found' });
  }

  res.json({ success: true, data: item });
});

// ─────────────────────────────────────────────
// POST /api/workspaces/:wid/webhook-deliveries/:deliveryId/retry
// ─────────────────────────────────────────────
const retryDelivery = asyncHandler(async (req, res) => {
  const workspace = getWid(req);
  const delivery = await WebhookDelivery.findOne({
    _id: req.params.deliveryId,
    workspace,
  }).populate('webhook');

  if (!delivery) {
    return res.status(404).json({ success: false, message: 'Delivery not found' });
  }

  if (!delivery.webhook) {
    return res.status(400).json({ success: false, message: 'Associated webhook not found' });
  }

  delivery.status = 'retrying';
  delivery.attempt = (delivery.attempt || 1) + 1;
  await delivery.save();

  // Fire async
  deliverWebhook({ webhook: delivery.webhook, delivery }).catch((err) =>
    console.error('[retryDelivery] Retry failed:', err.message)
  );

  await integrationActivityService.log({
    workspace,
    module: 'webhooks',
    action: 'webhook_delivery_retried',
    refModel: 'WebhookDelivery',
    refId: delivery._id,
    description: `Manual retry for delivery ${delivery._id}`,
    performedBy: req.user?._id,
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Delivery retry initiated', data: { deliveryId: delivery._id } });
});

// ─────────────────────────────────────────────
// POST /api/workspaces/:wid/webhook-deliveries/retry-failed
// ─────────────────────────────────────────────
const retryAllFailed = asyncHandler(async (req, res) => {
  const workspace = getWid(req);
  const webhookId = req.body.webhook || req.query.webhook;

  const query = { workspace, status: 'failed' };
  if (webhookId) query.webhook = webhookId;

  const deliveries = await WebhookDelivery.find(query)
    .populate('webhook')
    .limit(50);

  let scheduled = 0;
  for (const delivery of deliveries) {
    if (!delivery.webhook) continue;
    delivery.status = 'retry_scheduled';
    delivery.nextRetryAt = new Date();
    delivery.attempt = (delivery.attempt || 1) + 1;
    await delivery.save();
    scheduled++;
  }

  res.json({ success: true, message: `${scheduled} deliveries scheduled for retry` });
});

// ─────────────────────────────────────────────
// GET /api/workspaces/:wid/developer/activity
// ─────────────────────────────────────────────
const getDeveloperActivity = asyncHandler(async (req, res) => {
  const workspace = getWid(req);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const skip = (page - 1) * limit;

  const query = { workspace };
  if (req.query.module) query.module = req.query.module;
  if (req.query.action) query.action = req.query.action;

  const [items, total] = await Promise.all([
    IntegrationActivity.find(query)
      .populate('performedBy', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    IntegrationActivity.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

module.exports = {
  listDeliveries,
  getDelivery,
  retryDelivery,
  retryAllFailed,
  getDeveloperActivity,
};
