const cron = require("node-cron");
const dayjs = require("dayjs");
const Task = require("../models/Task");
const TaskHistory = require("../models/TaskHistory");
const notificationService = require("../services/notification.service");
const { runJobWithLog } = require("./cronUtils");

module.exports = function autoHoldJob() {
  cron.schedule(
    "0 0 * * *",
    async () => {
      await runJobWithLog("auto_hold_job", async () => {
        const tasks = await Task.find({
          "feedback.status": "requested",
          "feedback.dueAt": { $exists: true },
          status: { $nin: ["closed", "cancelled", "hold"] },
          isDeleted: { $ne: true }
        }).populate("assignedTo", "email firstName lastName");

        let successCount = 0;
        let failedCount = 0;

        for (const task of tasks) {
          try {
            const feedbackDueDate = task.feedback?.dueAt;
            if (!feedbackDueDate) continue;

            const delayDays = dayjs().diff(dayjs(feedbackDueDate), "day");

            // If feedback pending > 2 working days, hold the task
            if (delayDays >= 2 && task.status !== "hold") {
              const previousStatus = task.status;

              task.status = "hold";
              task.holdReason = `Feedback pending since ${dayjs(feedbackDueDate).format("DD MMM YYYY")}`;
              task.holdStartDate = new Date();
              await task.save();

              // Create history entry
              await TaskHistory.create({
                workspace: task.workspace,
                task: task._id,
                changedBy: "SYSTEM",
                changeType: "status_change",
                previousValue: previousStatus,
                newValue: "hold",
                reason: task.holdReason,
                metadata: {
                  autoHold: true,
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
                type: "task_auto_hold",
                refModel: "Task",
                refId: task._id,
                title: `Task On Hold: ${task.taskNumber}`,
                message: `${task.title} is on hold due to pending feedback for ${delayDays} day(s).`,
                actionUrl: `/tasks/${task._id}`,
                priority: "high",
                channels: { inApp: true, email: true },
                metadata: {
                  taskNumber: task.taskNumber,
                  previousStatus,
                  holdReason: task.holdReason
                }
              });

              successCount++;
            }
          } catch (err) {
            console.error(`Auto-hold for task ${task._id} failed`, err);
            failedCount++;
          }
        }

        return { processedCount: tasks.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
