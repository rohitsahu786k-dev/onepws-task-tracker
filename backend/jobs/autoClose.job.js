const cron = require("node-cron");
const dayjs = require("dayjs");
const Task = require("../models/Task");
const TaskHistory = require("../models/TaskHistory");
const notificationService = require("../services/notification.service");
const { runJobWithLog } = require("./cronUtils");

module.exports = function autoCloseJob() {
  cron.schedule(
    "30 0 * * *",
    async () => {
      await runJobWithLog("auto_close_job", async () => {
        const tasks = await Task.find({
          "feedback.status": "requested",
          "feedback.dueAt": { $exists: true },
          status: { $nin: ["closed", "cancelled"] },
          isDeleted: { $ne: true }
        }).populate("assignedTo", "email firstName lastName");

        let successCount = 0;
        let failedCount = 0;

        for (const task of tasks) {
          try {
            const feedbackDueDate = task.feedback?.dueAt;
            if (!feedbackDueDate) continue;

            const delayDays = dayjs().diff(dayjs(feedbackDueDate), "day");

            // If feedback pending > 5 working days, auto-close on last draft
            if (delayDays >= 5 && task.status !== "closed") {
              const previousStatus = task.status;

              task.status = "closed";
              task.closedAt = new Date();
              task.closedReason = `Auto-closed due to no feedback provided within ${delayDays} day(s)`;
              task.closedBy = "SYSTEM";
              await task.save();

              // Create history entry
              await TaskHistory.create({
                workspace: task.workspace,
                task: task._id,
                changedBy: "SYSTEM",
                changeType: "status_change",
                previousValue: previousStatus,
                newValue: "closed",
                reason: task.closedReason,
                metadata: {
                  autoClose: true,
                  feedbackDelayDays: delayDays
                }
              });

              // Notify stakeholders
              const recipients = [
                ...task.assignedTo.map(u => u._id),
                task.requestedBy,
                task.projectManager
              ].filter(Boolean);

              await notificationService.notifyOncePerDay({
                workspace: task.workspace,
                recipients,
                type: "task_auto_closed",
                refModel: "Task",
                refId: task._id,
                title: `Task Auto-Closed: ${task.taskNumber}`,
                message: `${task.title} has been automatically closed due to no feedback for ${delayDays} day(s).`,
                actionUrl: `/tasks/${task._id}`,
                priority: "medium",
                channels: { inApp: true, email: true },
                metadata: {
                  taskNumber: task.taskNumber,
                  previousStatus,
                  closureReason: task.closedReason
                }
              });

              successCount++;
            }
          } catch (err) {
            console.error(`Auto-close for task ${task._id} failed`, err);
            failedCount++;
          }
        }

        return { processedCount: tasks.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
