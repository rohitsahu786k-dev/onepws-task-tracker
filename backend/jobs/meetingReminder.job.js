const cron = require("node-cron");
const dayjs = require("dayjs");
const Meeting = require("../models/Meeting");
const notificationService = require("../services/notification.service");
const { runJobWithLog } = require("./cronUtils");

module.exports = function meetingReminderJob() {
  cron.schedule(
    "*/5 * * * *",
    async () => {
      await runJobWithLog("meeting_reminder_job", async () => {
        const now = new Date();
        const meetings = await Meeting.find({
          status: { $nin: ["cancelled", "completed"] },
          isDeleted: { $ne: true }
        }).populate("attendees.attendee", "email firstName lastName");

        let successCount = 0;
        let failedCount = 0;

        for (const meeting of meetings) {
          try {
            // Check for 24 hour reminder
            const before24h = dayjs(meeting.startDateTime).subtract(24, "hour").toDate();
            const now24h = dayjs(before24h).add(5, "minute").toDate();

            if (now >= before24h && now <= now24h) {
              if (!meeting.reminders || !meeting.reminders.sent24h) {
                await notificationService.notifyOncePerDay({
                  workspace: meeting.workspace,
                  recipients: meeting.attendees.map(a => a.attendee._id),
                  type: "meeting_reminder_24h",
                  refModel: "Meeting",
                  refId: meeting._id,
                  title: `Meeting Reminder: ${meeting.title}`,
                  message: `${meeting.title} is scheduled for tomorrow at ${dayjs(meeting.startDateTime).format("hh:mm A")}.`,
                  actionUrl: `/meetings/${meeting._id}`,
                  channels: { inApp: true, email: true },
                  metadata: {
                    meetingTitle: meeting.title,
                    startDateTime: meeting.startDateTime
                  }
                });

                meeting.reminders = meeting.reminders || {};
                meeting.reminders.sent24h = true;
                await meeting.save();
                successCount++;
              }
            }

            // Check for 30 minute reminder
            const before30m = dayjs(meeting.startDateTime).subtract(30, "minute").toDate();
            const now30m = dayjs(before30m).add(1, "minute").toDate();

            if (now >= before30m && now <= now30m) {
              if (!meeting.reminders || !meeting.reminders.sent30m) {
                await notificationService.notifyOncePerDay({
                  workspace: meeting.workspace,
                  recipients: meeting.attendees.map(a => a.attendee._id),
                  type: "meeting_reminder_30m",
                  refModel: "Meeting",
                  refId: meeting._id,
                  title: `Meeting Starting Soon: ${meeting.title}`,
                  message: `${meeting.title} is starting in 30 minutes.`,
                  actionUrl: `/meetings/${meeting._id}`,
                  channels: { inApp: true, email: true },
                  metadata: {
                    meetingTitle: meeting.title,
                    startDateTime: meeting.startDateTime
                  }
                });

                meeting.reminders = meeting.reminders || {};
                meeting.reminders.sent30m = true;
                await meeting.save();
                successCount++;
              }
            }
          } catch (err) {
            console.error(`Meeting ${meeting._id} reminder failed`, err);
            failedCount++;
          }
        }

        return { processedCount: meetings.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
