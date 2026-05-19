const cron = require("node-cron");
const dayjs = require("dayjs");
const Budget = require("../models/Budget");
const budgetUtilizationService = require("../services/budgetUtilization.service");
const budgetAlertService = require("../services/budgetAlert.service");
const notificationService = require("../services/notification.service");
const { runJobWithLog } = require("./cronUtils");

module.exports = function budgetAlertJob() {
  cron.schedule(
    "0 10 * * *",
    async () => {
      await runJobWithLog("budget_alert_job", async () => {
        const budgets = await Budget.find({
          status: { $in: ["active", "approved", "exhausted", "over_budget"] },
          isDeleted: { $ne: true }
        }).populate("project");

        let successCount = 0;
        let failedCount = 0;

        for (const budget of budgets) {
          try {
            await budgetUtilizationService.recalculateBudget(budget._id);
            await budgetAlertService.checkBudgetThresholds(budget._id);
            successCount++;
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
