const axios = require('axios');
const Webhook = require('../models/Webhook');
const WebhookDelivery = require('../models/WebhookDelivery');
const settingsEncryptionService = require('./settingsEncryption.service');
const webhookSignatureService = require('./webhookSignature.service');

/**
 * Attempt to deliver a single webhook delivery record.
 * On failure, updates delivery and schedules retry.
 */
async function deliverWebhook({ webhook, delivery }) {
  const startedAt = Date.now();

  try {
    const secret = settingsEncryptionService.decrypt(webhook.secretEncrypted);
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const signature = webhookSignatureService.generateSignature({
      payload: delivery.payload,
      secret,
      timestamp,
    });

    // Decrypt custom headers
    const customHeaders = {};
    for (const header of webhook.headers || []) {
      if (header.key && header.valueEncrypted) {
        customHeaders[header.key] = settingsEncryptionService.decrypt(
          header.valueEncrypted
        );
      }
    }

    const requestHeaders = {
      'Content-Type': 'application/json',
      'X-OnePWS-Event': delivery.event,
      'X-OnePWS-Delivery': delivery._id.toString(),
      'X-OnePWS-Timestamp': timestamp,
      'X-OnePWS-Signature': `sha256=${signature}`,
      ...customHeaders,
    };

    const response = await axios.post(webhook.url, delivery.payload, {
      timeout: (webhook.timeoutSeconds || 10) * 1000,
      headers: requestHeaders,
    });

    delivery.status = 'success';
    delivery.responseStatus = response.status;
    delivery.responseBody =
      typeof response.data === 'string'
        ? response.data.slice(0, 4096)
        : JSON.stringify(response.data).slice(0, 4096);
    delivery.responseHeaders = response.headers;
    delivery.responseTimeMs = Date.now() - startedAt;
    delivery.deliveredAt = new Date();
    delivery.requestHeaders = requestHeaders;

    await delivery.save();

    // Update webhook stats
    webhook.lastSuccessAt = new Date();
    webhook.lastTriggeredAt = new Date();
    webhook.successCount = (webhook.successCount || 0) + 1;
    webhook.failureCount = 0;
    await webhook.save();
  } catch (error) {
    delivery.status = 'failed';
    delivery.responseStatus = error.response?.status;
    delivery.responseBody = error.response?.data
      ? JSON.stringify(error.response.data).slice(0, 4096)
      : undefined;
    delivery.errorCode = error.code || 'DELIVERY_FAILED';
    delivery.errorMessage = error.message;
    delivery.responseTimeMs = Date.now() - startedAt;

    await delivery.save();

    // Update webhook stats
    webhook.lastFailureAt = new Date();
    webhook.lastTriggeredAt = new Date();
    webhook.failureCount = (webhook.failureCount || 0) + 1;
    await webhook.save();

    // Schedule retry
    const { scheduleRetry } = require('./webhookRetry.service');
    await scheduleRetry({ webhook, delivery });
  }
}

module.exports = { deliverWebhook };
