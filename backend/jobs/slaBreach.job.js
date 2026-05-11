const cron = require("node-cron");
const dayjs = require("dayjs");
const SLATracker = require("../models/SLATracker");
const notificationService = require("../services/notification.service");
const { runJobWithLog } = require("./cronUtils");

module.exports = function slaBreachJob() {
  cron.schedule(
    "0 * * * *",
    async () => {
      await runJobWithLog("sla_breach_job", async () => {
        const now = new Date();
        const slaTrackers = await SLATracker.find({
          overallStatus: { $in: ["on_track", "at_risk"] }
        }).populate("task");

        let successCount = 0;
        let failedCount = 0;

        for (const tracker of slaTrackers) {
          try {
            if (!tracker.task) continue;
            let breached = false;

            for (const phase of tracker.phases) {
              if (
                phase.status !== "completed" &&
                phase.plannedEndDate &&
                phase.plannedEndDate < now
              ) {
                const delayDays = dayjs(now).diff(dayjs(phase.plannedEndDate), "day");

                phase.status = "delayed";
                phase.delayDays = delayDays;
                breached = true;

                await notificationService.notifyOncePerDay({
                  workspace: tracker.workspace,
                  recipients: tracker.task.assignedTo,
                  type: "sla_breach",
                  refModel: "SLATracker",
                  refId: tracker._id,
                  title: `SLA Breach: ${tracker.task.taskNumber}`,
                  message: `${phase.phaseName} is delayed by ${delayDays} day(s).`,
                  actionUrl: `/tasks/${tracker.task._id}`,
                  priority: "urgent",
                  channels: { inApp: true, email: true, slack: true },
                  metadata: { taskNumber: tracker.task.taskNumber, slaPhase: phase.phaseName, delayDays }
                });
              }
            }

            if (breached) {
              tracker.overallStatus = "breached";
              await tracker.save();
            }
            successCount++;
          } catch(err) {
            console.error(`SLA Tracker ${tracker._id} failed`, err);
            failedCount++;
          }
        }

        return { processedCount: slaTrackers.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
