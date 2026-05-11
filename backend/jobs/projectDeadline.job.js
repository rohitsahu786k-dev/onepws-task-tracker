const cron = require("node-cron");
const dayjs = require("dayjs");
const Project = require("../models/Project");
const notificationService = require("../services/notification.service");
const { runJobWithLog } = require("./cronUtils");

module.exports = function projectDeadlineJob() {
  cron.schedule(
    "30 8 * * *",
    async () => {
      await runJobWithLog("project_deadline_job", async () => {
        const today = dayjs().startOf("day").toDate();
        const threeDaysFromNow = dayjs().add(3, "day").endOf("day").toDate();
        const projects = await Project.find({
          status: { $nin: ["closed", "cancelled"] },
          isDeleted: { $ne: true }
        }).populate("projectManager", "email firstName lastName").populate("owner", "email firstName lastName");

        let successCount = 0;
        let failedCount = 0;

        for (const project of projects) {
          try {
            if (!project.endDate) continue;

            const endDate = dayjs(project.endDate);
            const daysUntilEnd = endDate.diff(dayjs(today), "day");

            // Project due in 3 days
            if (daysUntilEnd === 3 && !project.alert3DaysSent) {
              await notificationService.notifyOncePerDay({
                workspace: project.workspace,
                recipients: [project.projectManager._id, project.owner._id].filter(Boolean),
                type: "project_due_in_3_days",
                refModel: "Project",
                refId: project._id,
                title: `Project Due in 3 Days: ${project.name}`,
                message: `${project.name} is due on ${endDate.format("DD MMM YYYY")}.`,
                actionUrl: `/projects/${project._id}`,
                priority: "high",
                channels: { inApp: true, email: true },
                metadata: {
                  projectName: project.name,
                  endDate: project.endDate,
                  daysUntilEnd: 3
                }
              });

              project.alert3DaysSent = true;
              await project.save();
              successCount++;
            }

            // Project due today
            if (daysUntilEnd === 0 && !project.alertDueTodaySent) {
              await notificationService.notifyOncePerDay({
                workspace: project.workspace,
                recipients: [project.projectManager._id, project.owner._id].filter(Boolean),
                type: "project_due_today",
                refModel: "Project",
                refId: project._id,
                title: `Project Due Today: ${project.name}`,
                message: `${project.name} is due today.`,
                actionUrl: `/projects/${project._id}`,
                priority: "urgent",
                channels: { inApp: true, email: true },
                metadata: {
                  projectName: project.name,
                  endDate: project.endDate
                }
              });

              project.alertDueTodaySent = true;
              await project.save();
              successCount++;
            }

            // Project overdue
            if (daysUntilEnd < 0 && project.status !== "overdue") {
              project.status = "overdue";
              await project.save();

              await notificationService.notifyOncePerDay({
                workspace: project.workspace,
                recipients: [project.projectManager._id, project.owner._id].filter(Boolean),
                type: "project_overdue",
                refModel: "Project",
                refId: project._id,
                title: `Project Overdue: ${project.name}`,
                message: `${project.name} is overdue by ${Math.abs(daysUntilEnd)} day(s).`,
                actionUrl: `/projects/${project._id}`,
                priority: "urgent",
                channels: { inApp: true, email: true, slack: true },
                metadata: {
                  projectName: project.name,
                  endDate: project.endDate,
                  overdueDays: Math.abs(daysUntilEnd)
                }
              });

              successCount++;
            }
          } catch (err) {
            console.error(`Project deadline check for ${project._id} failed`, err);
            failedCount++;
          }
        }

        return { processedCount: projects.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
