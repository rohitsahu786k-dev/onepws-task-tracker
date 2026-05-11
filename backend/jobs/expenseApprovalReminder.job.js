const cron = require("node-cron");
const dayjs = require("dayjs");
const Expense = require("../models/Expense");
const notificationService = require("../services/notification.service");
const { runJobWithLog } = require("./cronUtils");

module.exports = function expenseApprovalReminderJob() {
  cron.schedule(
    "30 10 * * *",
    async () => {
      await runJobWithLog("expense_approval_reminder_job", async () => {
        const configuredDays = 2;
        const expenseOlderThan = dayjs().subtract(configuredDays, "day").toDate();

        const expenses = await Expense.find({
          status: { $in: ["submitted", "pending"] },
          submittedAt: { $lte: expenseOlderThan },
          isDeleted: { $ne: true }
        }).populate("submittedBy", "email firstName lastName").populate("approver", "email firstName lastName");

        let successCount = 0;
        let failedCount = 0;

        for (const expense of expenses) {
          try {
            const pendingDays = dayjs().diff(dayjs(expense.submittedAt), "day");

            // Get approver
            const approverIds = expense.approver
              ? Array.isArray(expense.approver)
                ? expense.approver.map(a => a._id)
                : [expense.approver._id]
              : [];

            if (approverIds.length === 0) continue;

            await notificationService.notifyOncePerDay({
              workspace: expense.workspace,
              recipients: approverIds,
              type: "expense_approval_reminder",
              refModel: "Expense",
              refId: expense._id,
              title: `Expense Approval Reminder: ${expense.category}`,
              message: `Expense of ${expense.amount} from ${expense.submittedBy.firstName} is pending approval for ${pendingDays} day(s).`,
              actionUrl: `/expenses/${expense._id}`,
              priority: "medium",
              channels: { inApp: true, email: true },
              metadata: {
                expenseAmount: expense.amount,
                category: expense.category,
                submittedBy: expense.submittedBy.firstName,
                pendingDays,
                submittedAt: expense.submittedAt
              }
            });

            successCount++;
          } catch (err) {
            console.error(`Expense approval reminder for ${expense._id} failed`, err);
            failedCount++;
          }
        }

        return { processedCount: expenses.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
