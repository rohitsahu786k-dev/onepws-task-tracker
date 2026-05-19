const notificationService = require('./notification.service');

/**
 * Notify workspace owner/admin when a webhook has auto-paused due to failures.
 */
async function notifyWebhookFailed(webhook) {
  try {
    if (!webhook.createdBy) return;

    await notificationService.notify({
      workspace: webhook.workspace,
      recipients: [webhook.createdBy],
      type: 'webhook_auto_paused',
      title: `Webhook auto-paused: ${webhook.name}`,
      message: `Webhook "${webhook.name}" has been auto-paused due to 10+ consecutive failures. Please review and re-enable.`,
      refModel: 'Webhook',
      refId: webhook._id,
      actionUrl: `/settings/developer/webhooks/${webhook._id}`,
      priority: 'high',
      channels: { inApp: true, email: true },
    });
  } catch (err) {
    console.error('[webhookNotification] Failed to notify webhook failure:', err.message);
  }
}

/**
 * Notify about expiring API key.
 */
async function notifyApiKeyExpiring(apiKey) {
  try {
    if (!apiKey.createdBy) return;

    const dayjs = require('dayjs');
    const expiryStr = dayjs(apiKey.expiresAt).format('DD-MM-YYYY');

    await notificationService.notifyOncePerDay({
      workspace: apiKey.workspace,
      recipients: [apiKey.createdBy],
      type: 'api_key_expiring_soon',
      title: `API key expiring soon: ${apiKey.name}`,
      message: `API key "${apiKey.name}" (prefix: ${apiKey.keyPrefix}) expires on ${expiryStr}. Please renew or rotate.`,
      refModel: 'APIKey',
      refId: apiKey._id,
      actionUrl: `/settings/developer/api-keys/${apiKey._id}`,
      priority: 'normal',
      channels: { inApp: true, email: true },
    });
  } catch (err) {
    console.error('[webhookNotification] Failed to notify API key expiry:', err.message);
  }
}

module.exports = { notifyWebhookFailed, notifyApiKeyExpiring };
