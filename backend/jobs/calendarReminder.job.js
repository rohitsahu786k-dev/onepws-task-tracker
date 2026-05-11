const cron = require("node-cron");
const dayjs = require("dayjs");
const CalendarEvent = require("../models/CalendarEvent");
const notificationService = require("../services/notification.service");
const { runJobWithLog } = require("./cronUtils");

module.exports = function calendarReminderJob() {
  cron.schedule(
    "*/5 * * * *",
    async () => {
      await runJobWithLog("calendar_reminder_job", async () => {
        const now = new Date();
        const events = await CalendarEvent.find({
          status: { $nin: ["cancelled"] },
          isDeleted: { $ne: true },
          reminders: { $exists: true, $ne: [] }
        });

        let successCount = 0;
        let failedCount = 0;

        for (const event of events) {
          try {
            for (const reminder of event.reminders || []) {
              if (reminder.sent) continue;

              const reminderTime = dayjs(event.startDate).subtract(reminder.minutesBefore, "minute").toDate();
              const reminderWindow = dayjs(reminderTime).add(1, "minute").toDate();

              if (now >= reminderTime && now <= reminderWindow) {
                const assignedUsers = event.assignedTo || [];

                await notificationService.notifyOncePerDay({
                  workspace: event.workspace,
                  recipients: assignedUsers,
                  type: "calendar_reminder",
                  refModel: "CalendarEvent",
                  refId: event._id,
                  title: `Calendar Reminder: ${event.title}`,
                  message: `${event.title} is scheduled for ${dayjs(event.startDate).format("DD MMM YYYY hh:mm A")}.`,
                  actionUrl: `/calendar/${event._id}`,
                  channels: { inApp: true, email: true },
                  metadata: {
                    eventTitle: event.title,
                    startDate: event.startDate,
                    minutesBefore: reminder.minutesBefore
                  }
                });

                reminder.sent = true;
                await event.save();
                successCount++;
              }
            }
          } catch (err) {
            console.error(`Calendar event ${event._id} reminder failed`, err);
            failedCount++;
          }
        }

        return { processedCount: events.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
