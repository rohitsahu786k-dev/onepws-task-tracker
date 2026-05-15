const cron = require("node-cron");
const CalendarEvent = require("../models/CalendarEvent");
const { generateRecurringInstances } = require("../services/calendar.service");
const { runJobWithLog } = require("./cronUtils");

module.exports = function recurringCalendarEventJob() {
  cron.schedule(
    "20 0 * * *",
    async () => {
      await runJobWithLog("recurring_calendar_event_job", async () => {
        const recurringEvents = await CalendarEvent.find({
          isRecurring: true,
          isRecurringInstance: { $ne: true },
          isActive: { $ne: false },
          isDeleted: { $ne: true },
          status: { $nin: ["cancelled", "completed"] },
          "recurrenceRule.frequency": { $exists: true }
        });

        let successCount = 0;
        let failedCount = 0;

        for (const event of recurringEvents) {
          try {
            await generateRecurringInstances(event);
            successCount += 1;
          } catch (err) {
            console.error(`Recurring calendar event ${event._id} generation failed`, err);
            failedCount += 1;
          }
        }

        return { processedCount: recurringEvents.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
