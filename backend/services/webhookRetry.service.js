const dayjs = require('dayjs');
const WebhookDelivery = require('../models/WebhookDelivery');
const Webhook = require('../models/Webhook');

/**
 * Schedule a retry for a failed delivery.
 * Uses the webhook's retryPolicy to determine next retry time.
 */
async function scheduleRetry({ webhook, delivery }) {
  if (!webhook.retryPolicy?.enabled) return;

  if (delivery.attempt >= delivery.maxAttempts) {
    delivery.status = 'failed';
    await delivery.save();

    // Auto-pause webhook after 10 consecutive failures
    if ((webhook.failureCount || 0) >= 10) {
      webhook.status = 'failed';
      await webhook.save();

      try {
        const { notifyWebhookFailed } = require('./webhookNotification.service');
        await notifyWebhookFailed(webhook);
      } catch (e) {
        console.error('[webhookRetry] Notify failed:', e.message);
      }
    }

    return;
  }

  const intervals = webhook.retryPolicy.retryIntervalsMinutes || [1, 5, 15];
  const nextInterval = intervals[delivery.attempt - 1] || 15;

  delivery.status = 'retry_scheduled';
  delivery.nextRetryAt = dayjs().add(nextInterval, 'minute').toDate();
  await delivery.save();
}

/**
 * Process all deliveries that are due for retry.
 * Should be called by the webhook retry cron job every minute.
 */
async function processWebhookRetries() {
  const deliveries = await WebhookDelivery.find({
    status: 'retry_scheduled',
    nextRetryAt: { $lte: new Date() },
  }).populate('webhook');

  const { deliverWebhook } = require('./webhookDelivery.service');

  for (const delivery of deliveries) {
    if (!delivery.webhook) continue;

    delivery.status = 'retrying';
    delivery.attempt = (delivery.attempt || 1) + 1;
    await delivery.save();

    await deliverWebhook({
      webhook: delivery.webhook,
      delivery,
    });
  }

  return deliveries.length;
}

module.exports = { scheduleRetry, processWebhookRetries };
