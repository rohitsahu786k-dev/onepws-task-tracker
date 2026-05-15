const cron = require("node-cron");
const dayjs = require("dayjs");
const SLATracker = require("../models/SLATracker");
const SLAEscalation = require("../models/SLAEscalation");
const Task = require("../models/Task");
const notificationService = require("../services/notification.service");
const { runJobWithLog } = require("./cronUtils");

module.exports = function slaEscalationJob() {
  cron.schedule(
    "15 * * * *",
    async () => {
      await runJobWithLog("sla_escalation_job", async () => {
        const slaTrackers = await SLATracker.find({
          overallStatus: { $in: ["breached", "at_risk"] }
        }).populate("task");

        let successCount = 0;
        let failedCount = 0;

        for (const tracker of slaTrackers) {
          try {
            const now = new Date();
            let maxDelayDays = 0;

            for (const phase of tracker.phases || []) {
              if (phase.status === "delayed" && phase.plannedEndDate) {
                const delayDays = dayjs(now).diff(dayjs(phase.plannedEndDate), "day");
                maxDelayDays = Math.max(maxDelayDays, delayDays);
              }
            }

            if (maxDelayDays === 0) continue;

            // Level 1: 2 days delay
            if (maxDelayDays >= 2) {
              const existsLevel1 = await SLAEscalation.findOne({
                slaTracker: tracker._id,
                level: 1,
                createdAt: { $gte: dayjs().subtract(24, "hour").toDate() }
              });

              if (!existsLevel1) {
                await SLAEscalation.create({
                  workspace: tracker.workspace,
                  slaTracker: tracker._id,
                  task: tracker.task._id,
                  level: 1,
                  delayDays: maxDelayDays,
                  escalatedTo: [tracker.task.projectManager, ...tracker.task.assignedTo].filter(Boolean),
                  reason: `SLA breached by ${maxDelayDays} day(s). Level 1 escalation to Project Manager.`,
                  status: "pending"
                });

                const taskForLevel1 = await Task.findById(tracker.task._id).populate("department");
                const deptHead = taskForLevel1?.department?.head;

                if (deptHead) {
                  await notificationService.notifyOncePerDay({
                    workspace: tracker.workspace,
                    recipients: [deptHead],
                    type: "sla_escalation",
                    refModel: "SLATracker",
                    refId: tracker._id,
                    title: `SLA Escalation Level 1: ${tracker.task.taskNumber}`,
                    message: `${tracker.task.title} is delayed by ${maxDelayDays} day(s).`,
                    actionUrl: `/tasks/${tracker.task._id}`,
                    priority: "high",
                    channels: { inApp: true, email: true, slack: true },
                    metadata: {
                      taskNumber: tracker.task.taskNumber,
                      delayDays: maxDelayDays,
                      escalationLevel: 1
                    }
                  });
                }

                successCount++;
              }
            }

            // Level 2: 5 days delay
            if (maxDelayDays >= 5) {
              const existsLevel2 = await SLAEscalation.findOne({
                slaTracker: tracker._id,
                level: 2,
                createdAt: { $gte: dayjs().subtract(24, "hour").toDate() }
              });

              if (!existsLevel2) {
                const task = await Task.findById(tracker.task._id).populate("department");
                const deptHead = task.department?.head;

                await SLAEscalation.create({
                  workspace: tracker.workspace,
                  slaTracker: tracker._id,
                  task: tracker.task._id,
                  level: 2,
                  delayDays: maxDelayDays,
                  escalatedTo: [deptHead].filter(Boolean),
                  reason: `SLA breached by ${maxDelayDays} day(s). Level 2 escalation to Department Head.`,
                  status: "pending"
                });

                if (deptHead) {
                  await notificationService.notifyOncePerDay({
                    workspace: tracker.workspace,
                    recipients: [deptHead],
                    type: "sla_escalation",
                    refModel: "SLATracker",
                    refId: tracker._id,
                    title: `SLA Escalation Level 2: ${tracker.task.taskNumber}`,
                    message: `${tracker.task.title} is delayed by ${maxDelayDays} day(s). Escalated to Department Head.`,
                    actionUrl: `/tasks/${tracker.task._id}`,
                    priority: "urgent",
                    channels: { inApp: true, email: true, slack: true },
                    metadata: {
                      taskNumber: tracker.task.taskNumber,
                      delayDays: maxDelayDays,
                      escalationLevel: 2
                    }
                  });
                }

                successCount++;
              }
            }
          } catch (err) {
            console.error(`SLA tracker ${tracker._id} escalation failed`, err);
            failedCount++;
          }
        }

        return { processedCount: slaTrackers.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
