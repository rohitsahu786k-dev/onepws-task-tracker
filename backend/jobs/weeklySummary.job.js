const cron = require("node-cron");
const dayjs = require("dayjs");
const Task = require("../models/Task");
const User = require("../models/User");
const Department = require("../models/Department");
const Budget = require("../models/Budget");
const emailService = require("../services/email.service");
const { runJobWithLog } = require("./cronUtils");

module.exports = function weeklySummaryJob() {
  cron.schedule(
    "0 9 * * 1",
    async () => {
      await runJobWithLog("weekly_summary_job", async () => {
        const lastMonday = dayjs().subtract(7, "day").startOf("day").toDate();
        const thisMonday = dayjs().startOf("day").toDate();

        // Get admin and manager users
        const adminUsers = await User.find({
          workspace: { $exists: true },
          role: { $in: ["admin", "manager"] },
          isActive: true,
          isDeleted: { $ne: true }
        });

        let successCount = 0;
        let failedCount = 0;

        for (const admin of adminUsers) {
          try {
            const workspace = admin.workspace;

            // Last week stats
            const taskReceivedLastWeek = await Task.countDocuments({
              workspace,
              createdAt: { $gte: lastMonday, $lt: thisMonday },
              isDeleted: { $ne: true }
            });

            const tasksCompletedLastWeek = await Task.countDocuments({
              workspace,
              status: "closed",
              closedAt: { $gte: lastMonday, $lt: thisMonday },
              isDeleted: { $ne: true }
            });

            const tasksOverdueLastWeek = await Task.countDocuments({
              workspace,
              isOverdue: true,
              createdAt: { $gte: lastMonday, $lt: thisMonday },
              isDeleted: { $ne: true }
            });

            const tasksPendingLastWeek = await Task.countDocuments({
              workspace,
              status: { $nin: ["closed", "cancelled"] },
              dueDate: { $lt: thisMonday },
              isDeleted: { $ne: true }
            });

            // Department stats
            const departments = await Department.find({ workspace });
            const deptStats = await Promise.all(
              departments.map(async (dept) => ({
                name: dept.name,
                tasksReceived: await Task.countDocuments({
                  workspace,
                  requestedBy: { $in: dept.members || [] },
                  createdAt: { $gte: lastMonday, $lt: thisMonday }
                }),
                tasksCompleted: await Task.countDocuments({
                  workspace,
                  requestedBy: { $in: dept.members || [] },
                  status: "closed",
                  closedAt: { $gte: lastMonday, $lt: thisMonday }
                })
              }))
            );

            // This week deadlines
            const thisWeekEnd = dayjs().add(7, "day").endOf("day").toDate();
            const tasksThisWeekDeadline = await Task.find({
              workspace,
              dueDate: { $gte: thisMonday, $lt: thisWeekEnd },
              status: { $nin: ["closed", "cancelled"] },
              isDeleted: { $ne: true }
            }).limit(10);

            // Budget summary
            const budgets = await Budget.find({ workspace });
            const budgetAlerts = budgets.filter(b => {
              const utilized = (b.utilized || 0) / (b.amount || 1);
              return utilized >= 0.8;
            }).length;

            const summaryData = {
              adminName: admin.firstName || admin.email,
              weekStartDate: dayjs(lastMonday).format("DD MMM YYYY"),
              weekEndDate: dayjs(thisMonday).subtract(1, "day").format("DD MMM YYYY"),
              taskReceivedLastWeek,
              tasksCompletedLastWeek,
              tasksOverdueLastWeek,
              tasksPendingLastWeek,
              deptStats,
              upcomingDeadlines: tasksThisWeekDeadline.map(t => ({
                taskNumber: t.taskNumber,
                title: t.title,
                dueDate: dayjs(t.dueDate).format("DD MMM YYYY")
              })),
              budgetAlertsCount: budgetAlerts
            };

            await emailService.sendWeeklySummary(admin.email, summaryData);
            successCount++;
          } catch (err) {
            console.error(`Weekly summary for user ${admin._id} failed`, err);
            failedCount++;
          }
        }

        return { processedCount: adminUsers.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
