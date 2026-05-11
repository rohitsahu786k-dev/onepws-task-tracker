const cron = require("node-cron");
const dayjs = require("dayjs");
const CalendarEvent = require("../models/CalendarEvent");
const { runJobWithLog } = require("./cronUtils");

module.exports = function recurringCalendarEventJob() {
  cron.schedule(
    "20 0 * * *",
    async () => {
      await runJobWithLog("recurring_calendar_event_job", async () => {
        const today = dayjs().startOf("day").toDate();
        const futureDate = dayjs().add(90, "day").endOf("day").toDate();

        const recurringEvents = await CalendarEvent.find({
          isRecurring: true,
          isActive: true,
          isDeleted: { $ne: true }
        });

        let successCount = 0;
        let failedCount = 0;

        for (const event of recurringEvents) {
          try {
            // Get the last instance
            const lastInstance = await CalendarEvent.findOne({
              parentEventId: event._id,
              startDate: { $lte: today }
            }).sort({ startDate: -1 });

            let nextInstanceStart = lastInstance
              ? dayjs(lastInstance.startDate).add(1, event.recurringFrequency).toDate()
              : event.startDate;

            // Generate instances until future date
            while (nextInstanceStart <= futureDate) {
              // Check if instance already exists
              const existingInstance = await CalendarEvent.findOne({
                parentEventId: event._id,
                startDate: nextInstanceStart
              });

              if (!existingInstance) {
                const nextInstanceEnd = dayjs(nextInstanceStart)
                  .add(
                    dayjs(event.endDate).diff(dayjs(event.startDate), "minute"),
                    "minute"
                  )
                  .toDate();

                await CalendarEvent.create({
                  workspace: event.workspace,
                  title: event.title,
                  description: event.description,
                  startDate: nextInstanceStart,
                  endDate: nextInstanceEnd,
                  location: event.location,
                  assignedTo: event.assignedTo,
                  reminders: event.reminders,
                  eventType: event.eventType,
                  parentEventId: event._id,
                  isRecurring: false,
                  createdFrom: "recurring_event"
                });
              }

              // Move to next instance
              nextInstanceStart = dayjs(nextInstanceStart)
                .add(1, event.recurringFrequency)
                .toDate();
            }

            successCount++;
          } catch (err) {
            console.error(`Recurring calendar event ${event._id} generation failed`, err);
            failedCount++;
          }
        }

        return { processedCount: recurringEvents.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
