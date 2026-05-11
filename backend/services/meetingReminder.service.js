const dayjs = require('dayjs');
const cron = require('node-cron');
const Meeting = require('../models/Meeting');
const { notify } = require('./notification.service');
const { getMeetingLink } = require('./meetingEmail.service');

async function sendMeetingReminders() {
  const now = new Date();
  const meetings = await Meeting.find({
    status: { $in: ['scheduled', 'rescheduled'] },
    startDateTime: { $gte: now },
    reminders: { $elemMatch: { sent: { $ne: true } } }
  });

  for (const meeting of meetings) {
    let changed = false;
    for (const reminder of meeting.reminders || []) {
      if (reminder.sent) continue;
      const reminderTime = dayjs(meeting.startDateTime).subtract(reminder.minutesBefore || 0, 'minute').toDate();
      if (now < reminderTime) continue;

      const recipients = meeting.attendees?.map((attendee) => attendee.user).filter(Boolean) || [];
      if (recipients.length) {
        await notify({
          workspace: meeting.workspace,
          recipients,
          type: 'meeting_reminder',
          title: `Meeting Reminder: ${meeting.title}`,
          message: `Meeting starts at ${dayjs(meeting.startDateTime).format('hh:mm A')}`,
          refModel: 'Meeting',
          refId: meeting._id,
          actionUrl: `/meetings/${meeting._id}`,
          channels: {
            inApp: reminder.channel === 'in_app' || reminder.channel === 'both',
            email: reminder.channel === 'email' || reminder.channel === 'both'
          },
          metadata: {
            meetingTitle: meeting.title,
            meetingDate: meeting.startDateTime,
            meetingLink: getMeetingLink(meeting)
          }
        });
      }

      reminder.sent = true;
      reminder.sentAt = now;
      changed = true;
    }
    if (changed) await meeting.save();
  }
}

cron.schedule('*/5 * * * *', () => {
  sendMeetingReminders().catch((error) => console.error('Meeting reminder cron failed', error));
});

module.exports = { sendMeetingReminders };
