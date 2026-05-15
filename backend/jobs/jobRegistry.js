const { sendMeetingReminders } = require('../services/meetingReminder.service');
const { runJobWithLog } = require('./cronUtils');

const jobHandlers = {
  meeting_reminder_job: () => runJobWithLog('meeting_reminder_job', async () => {
    await sendMeetingReminders();
    return { processedCount: 1, successCount: 1, failedCount: 0 };
  })
};

async function runJobByName(jobName) {
  const handler = jobHandlers[jobName];
  if (!handler) {
    const error = new Error(`Manual run is not configured for job: ${jobName}`);
    error.statusCode = 404;
    throw error;
  }
  return handler();
}

module.exports = { runJobByName, jobHandlers };
