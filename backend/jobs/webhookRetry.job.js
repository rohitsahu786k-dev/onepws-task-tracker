const cron = require('node-cron');
const { processWebhookRetries } = require('../services/webhookRetry.service');

/**
 * Webhook Retry Cron Job
 * Runs every minute to process scheduled retries.
 */
function webhookRetryJob() {
  cron.schedule('* * * * *', async () => {
    try {
      const count = await processWebhookRetries();
      if (count > 0) {
        console.log(`[webhookRetry] Processed ${count} retry deliveries`);
      }
    } catch (err) {
      console.error('[webhookRetry] Cron error:', err.message);
    }
  });

  console.log('✓ Webhook retry cron registered (every minute)');
}

module.exports = webhookRetryJob;
