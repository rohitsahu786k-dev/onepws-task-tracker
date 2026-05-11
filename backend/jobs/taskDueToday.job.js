const cron = require("node-cron");
const dayjs = require("dayjs");
const Task = require("../models/Task");
const notificationService = require("../services/notification.service");
const { runJobWithLog } = require("./cronUtils");

module.exports = function taskDueTodayJob() {
  cron.schedule(
    "0 8 * * *",
    async () => {
      await runJobWithLog("task_due_today_job", async () => {
        const start = dayjs().startOf("day").toDate();
        const end = dayjs().endOf("day").toDate();

        const tasks = await Task.find({
          dueDate: { $gte: start, $lte: end },
          status: { $nin: ["closed", "cancelled"] },
          isDeleted: { $ne: true }
        });

        let successCount = 0;
        let failedCount = 0;

        for (const task of tasks) {
          try {
            await notificationService.notifyOncePerDay({
              workspace: task.workspace,
              recipients: task.assignedTo,
              type: "task_due_today",
              refModel: "Task",
              refId: task._id,
              title: `Task Due Today: ${task.taskNumber}`,
              message: `${task.title} is due today.`,
              actionUrl: `/tasks/${task._id}`,
              channels: { inApp: true, email: true },
              metadata: { taskNumber: task.taskNumber, dueDate: task.dueDate }
            });
            successCount++;
          } catch(err) {
            console.error(`Task ${task._id} notification failed`, err);
            failedCount++;
          }
        }

        return { processedCount: tasks.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
