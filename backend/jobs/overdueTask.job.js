const cron = require("node-cron");
const dayjs = require("dayjs");
const Task = require("../models/Task");
const notificationService = require("../services/notification.service");
// const calendarService = require("../services/calendar.service"); // Assuming a calendar.service exists
const { runJobWithLog } = require("./cronUtils");

module.exports = function overdueTaskJob() {
  cron.schedule(
    "0 9 * * *",
    async () => {
      await runJobWithLog("overdue_task_job", async () => {
        const todayStart = dayjs().startOf("day").toDate();

        const tasks = await Task.find({
          dueDate: { $lt: todayStart },
          status: { $nin: ["closed", "cancelled"] },
          isDeleted: { $ne: true }
        });

        let successCount = 0;
        let failedCount = 0;

        for (const task of tasks) {
          try {
            const delayDays = dayjs(todayStart).diff(dayjs(task.dueDate), "day");

            task.isOverdue = true;
            task.delayInDays = delayDays;
            task.delayStatus = "delayed";
            await task.save();

            // if (calendarService.markTaskEventOverdue) {
            //   await calendarService.markTaskEventOverdue(task);
            // }

            await notificationService.notifyOncePerDay({
              workspace: task.workspace,
              recipients: task.assignedTo, // Add managers/admins as per specific rules
              type: "task_overdue",
              refModel: "Task",
              refId: task._id,
              title: `Task Overdue: ${task.taskNumber}`,
              message: `${task.title} is overdue by ${delayDays} day(s).`,
              actionUrl: `/tasks/${task._id}`,
              priority: "high",
              channels: { inApp: true, email: true, slack: true },
              metadata: { taskNumber: task.taskNumber, delayDays }
            });
            successCount++;
          } catch(err) {
            console.error(`Overdue Task ${task._id} failed`, err);
            failedCount++;
          }
        }

        return { processedCount: tasks.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
