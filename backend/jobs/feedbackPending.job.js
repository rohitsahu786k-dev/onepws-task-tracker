const cron = require("node-cron");
const dayjs = require("dayjs");
const Task = require("../models/Task");
const notificationService = require("../services/notification.service");
const { runJobWithLog } = require("./cronUtils");

module.exports = function feedbackPendingJob() {
  cron.schedule(
    "30 * * * *",
    async () => {
      await runJobWithLog("feedback_pending_job", async () => {
        const tasks = await Task.find({
          "feedback.status": "requested",
          "feedback.dueAt": { $lte: new Date() },
          status: { $nin: ["closed", "cancelled"] },
          isDeleted: { $ne: true }
        }).populate("requestedBy", "email firstName lastName");

        let successCount = 0;
        let failedCount = 0;

        for (const task of tasks) {
          try {
            const feedbackDueDate = task.feedback?.dueAt;
            if (!feedbackDueDate) continue;

            const delayDays = dayjs().diff(dayjs(feedbackDueDate), "day");

            // 2 working days passed - alert
            if (delayDays >= 2 && task.feedback?.notifiedAt === undefined) {
              await notificationService.notifyOncePerDay({
                workspace: task.workspace,
                recipients: [task.requestedBy._id],
                type: "feedback_overdue",
                refModel: "Task",
                refId: task._id,
                title: `Feedback Overdue: ${task.taskNumber}`,
                message: `Please provide feedback on ${task.title}. It's ${delayDays} day(s) overdue.`,
                actionUrl: `/tasks/${task._id}`,
                priority: "high",
                channels: { inApp: true, email: true },
                metadata: {
                  taskNumber: task.taskNumber,
                  delayDays,
                  dueDate: feedbackDueDate
                }
              });

              task.feedback.notifiedAt = new Date();
              await task.save();
              successCount++;
            }
          } catch (err) {
            console.error(`Feedback pending for task ${task._id} failed`, err);
            failedCount++;
          }
        }

        return { processedCount: tasks.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
