const cron = require("node-cron");
const dayjs = require("dayjs");
const TrackerRow = require("../models/TrackerRow");
const Task = require("../models/Task");
const notificationService = require("../services/notification.service");
const { runJobWithLog } = require("./cronUtils");

module.exports = function trackerDelayCheckJob() {
  cron.schedule(
    "15 9 * * *",
    async () => {
      await runJobWithLog("tracker_delay_check_job", async () => {
        const today = dayjs().startOf("day").toDate();
        const rows = await TrackerRow.find({
          "rowData.final_status": "pending",
          "rowData.my_target_due_date": { $lt: today },
          isDeleted: { $ne: true }
        }).populate("handledBy", "email firstName lastName");

        let successCount = 0;
        let failedCount = 0;

        for (const row of rows) {
          try {
            const myTargetDueDate = row.rowData?.my_target_due_date;
            if (!myTargetDueDate) continue;

            const delayDays = dayjs(today).diff(dayjs(myTargetDueDate), "day");

            // Update calculated data with delay information
            row.calculatedData = row.calculatedData || {};
            row.calculatedData.delay_in_task_closure = delayDays;
            row.calculatedData.delay_in_time = `Delayed by ${delayDays} day(s)`;
            await row.save();

            // Check if linked task exists, update it
            if (row.linkedTaskId) {
              await Task.findByIdAndUpdate(row.linkedTaskId, {
                delayInDays: delayDays,
                delayStatus: "delayed"
              });
            }

            // Notify task handler
            if (row.handledBy) {
              await notificationService.notifyOncePerDay({
                workspace: row.workspace,
                recipients: [row.handledBy._id],
                type: "tracker_delay_alert",
                refModel: "TrackerRow",
                refId: row._id,
                title: `Tracker Row Delay: ${row.rowData?.unique_id}`,
                message: `Tracker row ${row.rowData?.unique_id} is delayed by ${delayDays} day(s).`,
                actionUrl: `/trackers/${row.tracker}/rows/${row._id}`,
                priority: "high",
                channels: { inApp: true, email: true },
                metadata: {
                  trackerId: row.tracker,
                  rowId: row._id,
                  delayDays,
                  myTargetDueDate
                }
              });
            }

            successCount++;
          } catch (err) {
            console.error(`Tracker row ${row._id} delay check failed`, err);
            failedCount++;
          }
        }

        return { processedCount: rows.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
