const cron = require("node-cron");
const dayjs = require("dayjs");
const IntakeForm = require("../models/IntakeForm");
const User = require("../models/User");
const notificationService = require("../services/notification.service");
const { runJobWithLog } = require("./cronUtils");

module.exports = function intakeReviewReminderJob() {
  cron.schedule(
    "45 * * * *",
    async () => {
      await runJobWithLog("intake_review_reminder_job", async () => {
        const oneDayAgo = dayjs().subtract(24, "hour").toDate();
        const intakeForms = await IntakeForm.find({
          status: { $in: ["submitted", "under_review"] },
          submittedAt: { $exists: true, $lte: oneDayAgo },
          isDeleted: { $ne: true }
        }).populate("submittedBy", "email firstName lastName");

        let successCount = 0;
        let failedCount = 0;

        for (const form of intakeForms) {
          try {
            const reviewPendingHours = dayjs().diff(dayjs(form.submittedAt), "hour");
            const reviewPendingDays = dayjs().diff(dayjs(form.submittedAt), "day");

            // Get marketing admin users
            const marketingAdmins = await User.find({
              workspace: form.workspace,
              role: { $in: ["admin", "marketing_admin"] },
              isActive: true,
              isDeleted: { $ne: true }
            });

            if (marketingAdmins.length === 0) continue;

            // Send reminder to marketing admin
            await notificationService.notifyOncePerDay({
              workspace: form.workspace,
              recipients: marketingAdmins.map(u => u._id),
              type: "intake_review_pending",
              refModel: "IntakeForm",
              refId: form._id,
              title: `Intake Form Pending Review: ${form.title}`,
              message: `${form.title} from ${form.submittedBy.firstName} has been pending review for ${reviewPendingDays} day(s).`,
              actionUrl: `/intake-forms/${form._id}`,
              priority: "high",
              channels: { inApp: true, email: true },
              metadata: {
                formTitle: form.title,
                submittedBy: form.submittedBy.firstName,
                pendingDays: reviewPendingDays,
                submittedAt: form.submittedAt
              }
            });

            // Auto-reject if pending > 3 days (optional, based on config)
            if (reviewPendingDays > 3 && form.status === "submitted") {
              form.status = "auto_rejected";
              form.rejectionReason = "Automatically rejected due to no action taken within 3 days";
              form.rejectedAt = new Date();
              form.rejectedBy = "SYSTEM";
              await form.save();

              // Notify submitter
              await notificationService.notifyOncePerDay({
                workspace: form.workspace,
                recipients: [form.submittedBy._id],
                type: "intake_auto_rejected",
                refModel: "IntakeForm",
                refId: form._id,
                title: `Intake Form Auto-Rejected: ${form.title}`,
                message: `Your intake form ${form.title} has been automatically rejected due to inactivity.`,
                actionUrl: `/intake-forms/${form._id}`,
                priority: "medium",
                channels: { inApp: true, email: true },
                metadata: {
                  formTitle: form.title,
                  rejectionReason: form.rejectionReason
                }
              });
            }

            successCount++;
          } catch (err) {
            console.error(`Intake review reminder for ${form._id} failed`, err);
            failedCount++;
          }
        }

        return { processedCount: intakeForms.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
