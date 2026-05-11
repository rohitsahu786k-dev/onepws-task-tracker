const cron = require("node-cron");
const dayjs = require("dayjs");
const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const notificationService = require("../services/notification.service");
const { runJobWithLog } = require("./cronUtils");

module.exports = function budgetAlertJob() {
  cron.schedule(
    "0 10 * * *",
    async () => {
      await runJobWithLog("budget_alert_job", async () => {
        const budgets = await Budget.find({
          isActive: true,
          isDeleted: { $ne: true }
        }).populate("owner", "email firstName lastName").populate("project");

        let successCount = 0;
        let failedCount = 0;

        for (const budget of budgets) {
          try {
            const utilized = budget.utilized || 0;
            const amount = budget.amount || 1;
            const utilization = (utilized / amount) * 100;

            // Budget 80% used alert
            if (utilization >= 80 && utilization < 100 && !budget.alert80Sent) {
              await notificationService.notifyOncePerDay({
                workspace: budget.workspace,
                recipients: [budget.owner._id],
                type: "budget_80_percent",
                refModel: "Budget",
                refId: budget._id,
                title: `Budget 80% Utilized: ${budget.project?.name}`,
                message: `Budget for ${budget.project?.name} has reached 80% utilization (${utilized}/${amount}).`,
                actionUrl: `/projects/${budget.project._id}/budget`,
                priority: "high",
                channels: { inApp: true, email: true },
                metadata: {
                  projectName: budget.project?.name,
                  utilized,
                  total: amount,
                  utilization
                }
              });

              budget.alert80Sent = true;
              await budget.save();
              successCount++;
            }

            // Budget 100% used alert
            if (utilization >= 100 && !budget.alert100Sent) {
              await notificationService.notifyOncePerDay({
                workspace: budget.workspace,
                recipients: [budget.owner._id],
                type: "budget_100_percent",
                refModel: "Budget",
                refId: budget._id,
                title: `Budget Exhausted: ${budget.project?.name}`,
                message: `Budget for ${budget.project?.name} is fully utilized (${utilized}/${amount}).`,
                actionUrl: `/projects/${budget.project._id}/budget`,
                priority: "urgent",
                channels: { inApp: true, email: true },
                metadata: {
                  projectName: budget.project?.name,
                  utilized,
                  total: amount
                }
              });

              budget.alert100Sent = true;
              await budget.save();
              successCount++;
            }

            // Pending expense approvals > 2 days
            const pendingExpenses = await Expense.find({
              budget: budget._id,
              status: { $in: ["submitted", "pending"] },
              createdAt: { $lte: dayjs().subtract(2, "day").toDate() }
            });

            if (pendingExpenses.length > 0) {
              await notificationService.notifyOncePerDay({
                workspace: budget.workspace,
                recipients: [budget.owner._id],
                type: "expense_approval_pending",
                refModel: "Budget",
                refId: budget._id,
                title: `${pendingExpenses.length} Expense Approvals Pending: ${budget.project?.name}`,
                message: `${pendingExpenses.length} expense(s) are pending approval for over 2 days.`,
                actionUrl: `/projects/${budget.project._id}/expenses`,
                priority: "medium",
                channels: { inApp: true, email: true },
                metadata: {
                  projectName: budget.project?.name,
                  pendingCount: pendingExpenses.length
                }
              });

              successCount++;
            }
          } catch (err) {
            console.error(`Budget alert for ${budget._id} failed`, err);
            failedCount++;
          }
        }

        return { processedCount: budgets.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
