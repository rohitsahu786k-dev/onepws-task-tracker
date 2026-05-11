const cron = require("node-cron");
const dayjs = require("dayjs");
const MOM = require("../models/MOM");
const notificationService = require("../services/notification.service");
const { runJobWithLog } = require("./cronUtils");

module.exports = function momSignatureReminderJob() {
  cron.schedule(
    "30 9 * * *",
    async () => {
      await runJobWithLog("mom_signature_reminder_job", async () => {
        const moms = await MOM.find({
          status: { $in: ["sent_for_signature", "partially_signed"] },
          isDeleted: { $ne: true }
        }).populate("attendees.attendee", "email firstName lastName");

        let successCount = 0;
        let failedCount = 0;

        for (const mom of moms) {
          try {
            const pendingAttendees = (mom.attendees || [])
              .filter(a => !a.signed)
              .map(a => a.attendee._id);

            if (pendingAttendees.length === 0) continue;

            // Send reminder to pending attendees
            await notificationService.notifyOncePerDay({
              workspace: mom.workspace,
              recipients: pendingAttendees,
              type: "mom_pending_signature",
              refModel: "MOM",
              refId: mom._id,
              title: `MOM Awaiting Your Signature: ${mom.title}`,
              message: `Please sign the MOM from meeting on ${dayjs(mom.meetingDate).format("DD MMM YYYY")}.`,
              actionUrl: `/mom/${mom._id}`,
              priority: "high",
              channels: { inApp: true, email: true },
              metadata: {
                momTitle: mom.title,
                meetingDate: mom.meetingDate,
                pendingCount: pendingAttendees.length
              }
            });

            // Check if pending > 2 days, escalate to creator
            const createdDaysAgo = dayjs().diff(dayjs(mom.createdAt), "day");
            if (createdDaysAgo > 2) {
              await notificationService.notifyOncePerDay({
                workspace: mom.workspace,
                recipients: [mom.createdBy],
                type: "mom_signature_pending_escalation",
                refModel: "MOM",
                refId: mom._id,
                title: `MOM Signature Pending for ${createdDaysAgo} Days: ${mom.title}`,
                message: `${pendingAttendees.length} attendee(s) are still pending to sign this MOM.`,
                actionUrl: `/mom/${mom._id}`,
                priority: "high",
                channels: { inApp: true, email: true },
                metadata: {
                  momTitle: mom.title,
                  pendingDays: createdDaysAgo,
                  pendingAttendeeCount: pendingAttendees.length
                }
              });
            }

            successCount++;
          } catch (err) {
            console.error(`MOM ${mom._id} reminder failed`, err);
            failedCount++;
          }
        }

        return { processedCount: moms.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
