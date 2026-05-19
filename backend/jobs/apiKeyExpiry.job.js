const cron = require('node-cron');
const dayjs = require('dayjs');
const APIKey = require('../models/APIKey');
const { notifyApiKeyExpiring } = require('../services/webhookNotification.service');

/**
 * API Key Expiry Cron Job
 * Runs daily at 09:00 AM:
 * - Notifies creators/admins about keys expiring in next 7 days
 * - Marks expired keys as status='expired'
 */
function apiKeyExpiryJob() {
  cron.schedule('0 9 * * *', async () => {
    try {
      const today = dayjs().startOf('day');
      const next7 = today.add(7, 'day').endOf('day');

      // Notify expiring soon
      const expiringKeys = await APIKey.find({
        status: 'active',
        expiresAt: {
          $gte: today.toDate(),
          $lte: next7.toDate(),
        },
      });

      for (const key of expiringKeys) {
        await notifyApiKeyExpiring(key);
      }

      // Mark expired keys
      const result = await APIKey.updateMany(
        {
          status: 'active',
          expiresAt: { $lt: new Date() },
        },
        { status: 'expired' }
      );

      if (result.modifiedCount > 0) {
        console.log(`[apiKeyExpiry] Marked ${result.modifiedCount} keys as expired`);
      }

      if (expiringKeys.length > 0) {
        console.log(`[apiKeyExpiry] Notified about ${expiringKeys.length} expiring keys`);
      }
    } catch (err) {
      console.error('[apiKeyExpiry] Cron error:', err.message);
    }
  });

  console.log('✓ API key expiry cron registered (09:00 AM daily)');
}

module.exports = apiKeyExpiryJob;
