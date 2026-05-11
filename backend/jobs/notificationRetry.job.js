const cron = require('node-cron');
const dayjs = require('dayjs');
const NotificationLog = require('../models/NotificationLog');
const notificationService = require('../services/notification.service');
const { runJobWithLog } = require('./cronUtils');

const RETRY_DELAYS_MINUTES = [5, 15, 30];

module.exports = function notificationRetryJob() {
  cron.schedule(
    '*/10 * * * *',
    async () => {
      await runJobWithLog('notification_retry_job', async () => {
        const logs = await NotificationLog.find({
          status: 'failed',
          channel: { $in: ['email', 'slack', 'telegram'] },
          retryCount: { $lt: 3 }
        })
          .sort({ updatedAt: 1 })
          .limit(50);

        let successCount = 0;
        let skippedCount = 0;
        let failedCount = 0;

        for (const log of logs) {
          const delay = RETRY_DELAYS_MINUTES[log.retryCount] || 30;
          if (dayjs(log.updatedAt).add(delay, 'minute').isAfter(dayjs())) {
            skippedCount++;
            continue;
          }

          try {
            await notificationService.retryDelivery(log);
            successCount++;
          } catch (error) {
            failedCount++;
          }
        }

        return { processedCount: logs.length, successCount, skippedCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata' }
  );
};
