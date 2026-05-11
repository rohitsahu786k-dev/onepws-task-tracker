const cron = require("node-cron");
const dayjs = require("dayjs");
const TaskTemplate = require("../models/TaskTemplate");
const Task = require("../models/Task");
const Counter = require("../models/Counter");
const CalendarEvent = require("../models/CalendarEvent");
const notificationService = require("../services/notification.service");
const { runJobWithLog } = require("./cronUtils");

module.exports = function recurringTaskJob() {
  cron.schedule(
    "10 0 * * *",
    async () => {
      await runJobWithLog("recurring_task_job", async () => {
        const today = dayjs().startOf("day").toDate();
        const templates = await TaskTemplate.find({
          isRecurring: true,
          isActive: true,
          isDeleted: { $ne: true }
        });

        let successCount = 0;
        let failedCount = 0;

        for (const template of templates) {
          try {
            if (!template.nextRunDate || template.nextRunDate > today) {
              continue;
            }

            // Generate task number
            const counter = await Counter.findOneAndUpdate(
              { model: "Task", workspace: template.workspace },
              { $inc: { count: 1 } },
              { new: true, upsert: true }
            );

            const taskNumber = `TSK-${String(counter.count).padStart(5, "0")}`;

            // Create new task from template
            const newTask = await Task.create({
              workspace: template.workspace,
              taskNumber,
              title: template.title,
              description: template.description,
              requestedBy: template.requestedBy,
              assignedTo: template.assignedTo,
              projectManager: template.projectManager,
              department: template.department,
              priority: template.priority,
              type: template.type,
              dueDate: dayjs(today).add(template.dueDaysFromNow || 5, "day").toDate(),
              status: "open",
              createdFrom: "recurring_template",
              templateId: template._id
            });

            // Create calendar event if specified
            if (template.createCalendarEvent) {
              await CalendarEvent.create({
                workspace: template.workspace,
                title: `Task: ${newTask.title}`,
                description: `Task ${newTask.taskNumber} created from recurring template`,
                startDate: newTask.dueDate,
                endDate: dayjs(newTask.dueDate).add(1, "hour").toDate(),
                assignedTo: template.assignedTo,
                refModel: "Task",
                refId: newTask._id,
                eventType: "task"
              });
            }

            // Notify assignees
            await notificationService.notifyOncePerDay({
              workspace: template.workspace,
              recipients: template.assignedTo,
              type: "recurring_task_created",
              refModel: "Task",
              refId: newTask._id,
              title: `New Recurring Task: ${newTask.taskNumber}`,
              message: `${newTask.title} has been created from recurring template.`,
              actionUrl: `/tasks/${newTask._id}`,
              channels: { inApp: true, email: true },
              metadata: {
                taskNumber: newTask.taskNumber,
                dueDate: newTask.dueDate
              }
            });

            // Calculate next run date
            let nextRun;
            if (template.recurringFrequency === "daily") {
              nextRun = dayjs(today).add(1, "day").toDate();
            } else if (template.recurringFrequency === "weekly") {
              nextRun = dayjs(today).add(1, "week").toDate();
            } else if (template.recurringFrequency === "biweekly") {
              nextRun = dayjs(today).add(2, "week").toDate();
            } else if (template.recurringFrequency === "monthly") {
              nextRun = dayjs(today).add(1, "month").toDate();
            } else {
              nextRun = dayjs(today).add(1, "day").toDate();
            }

            template.nextRunDate = nextRun;
            template.lastRunDate = today;
            await template.save();

            successCount++;
          } catch (err) {
            console.error(`Recurring task from template ${template._id} failed`, err);
            failedCount++;
          }
        }

        return { processedCount: templates.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
