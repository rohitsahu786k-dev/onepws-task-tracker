const cron = require('node-cron');
const { runJobWithLog } = require('./cronUtils');
const { sendMeetingReminders } = require('../services/meetingReminder.service');

module.exports = function meetingReminderJob() {
  cron.schedule(
    '*/5 * * * *',
    async () => {
      await runJobWithLog('meeting_reminder_job', async () => {
        await sendMeetingReminders();
        return { processedCount: 1, successCount: 1, failedCount: 0 };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata' }
  );
};
