const cron = require("node-cron");
const dayjs = require("dayjs");
const Task = require("../models/Task");
const Meeting = require("../models/Meeting");
const MOM = require("../models/MOM");
const Notification = require("../models/Notification");
const User = require("../models/User");
const emailService = require("../services/email.service");
const { runJobWithLog } = require("./cronUtils");

module.exports = function dailyDigestJob() {
  cron.schedule(
    "0 19 * * *",
    async () => {
      await runJobWithLog("daily_digest_job", async () => {
        const yesterday = dayjs().subtract(1, "day").startOf("day").toDate();
        const today = dayjs().startOf("day").toDate();
        const tomorrow = dayjs().add(1, "day").startOf("day").toDate();

        const users = await User.find({
          isActive: true,
          isDeleted: { $ne: true }
        });

        let successCount = 0;
        let failedCount = 0;

        for (const user of users) {
          try {
            // Get digest data for this user
            const tasksAssignedToday = await Task.find({
              workspace: user.workspace,
              assignedTo: user._id,
              createdAt: { $gte: yesterday, $lt: today },
              isDeleted: { $ne: true }
            }).limit(10);

            const tasksCompletedToday = await Task.find({
              workspace: user.workspace,
              assignedTo: user._id,
              status: "closed",
              closedAt: { $gte: yesterday, $lt: today },
              isDeleted: { $ne: true }
            }).limit(10);

            const tasksDueTomorrow = await Task.find({
              workspace: user.workspace,
              assignedTo: user._id,
              dueDate: { $gte: today, $lt: tomorrow },
              status: { $nin: ["closed", "cancelled"] },
              isDeleted: { $ne: true }
            }).limit(10);

            const overdueTasks = await Task.find({
              workspace: user.workspace,
              assignedTo: user._id,
              isOverdue: true,
              status: { $nin: ["closed", "cancelled"] },
              isDeleted: { $ne: true }
            }).limit(10);

            const momsPendingSign = await MOM.find({
              workspace: user.workspace,
              "attendees.attendee": user._id,
              "attendees.signed": false,
              status: { $in: ["sent_for_signature", "partially_signed"] },
              isDeleted: { $ne: true }
            }).limit(5);

            const upcomingMeetings = await Meeting.find({
              workspace: user.workspace,
              "attendees.attendee": user._id,
              startDateTime: { $gte: today, $lt: dayjs().add(3, "day").toDate() },
              status: { $nin: ["cancelled", "completed"] },
              isDeleted: { $ne: true }
            }).limit(5);

            const unreadNotifications = await Notification.find({
              workspace: user.workspace,
              recipient: user._id,
              isRead: false,
              createdAt: { $gte: yesterday }
            }).limit(10);

            // Only send if there's content
            const hasContent = 
              tasksAssignedToday.length > 0 ||
              tasksCompletedToday.length > 0 ||
              tasksDueTomorrow.length > 0 ||
              overdueTasks.length > 0 ||
              momsPendingSign.length > 0 ||
              upcomingMeetings.length > 0 ||
              unreadNotifications.length > 0;

            if (!hasContent) {
              continue;
            }

            const digestData = {
              userName: user.firstName || user.email,
              date: dayjs().format("DD MMM YYYY"),
              tasksAssignedToday: tasksAssignedToday.map(t => ({
                taskNumber: t.taskNumber,
                title: t.title,
                priority: t.priority
              })),
              tasksCompletedToday: tasksCompletedToday.map(t => ({
                taskNumber: t.taskNumber,
                title: t.title
              })),
              tasksDueTomorrow: tasksDueTomorrow.map(t => ({
                taskNumber: t.taskNumber,
                title: t.title,
                dueDate: dayjs(t.dueDate).format("hh:mm A")
              })),
              overdueTasks: overdueTasks.map(t => ({
                taskNumber: t.taskNumber,
                title: t.title,
                delayDays: t.delayInDays || 0
              })),
              momsPendingSign: momsPendingSign.length,
              upcomingMeetings: upcomingMeetings.map(m => ({
                title: m.title,
                startDateTime: dayjs(m.startDateTime).format("DD MMM hh:mm A")
              })),
              notificationCount: unreadNotifications.length
            };

            await emailService.sendDailyDigest(user.email, digestData);
            successCount++;
          } catch (err) {
            console.error(`Daily digest for user ${user._id} failed`, err);
            failedCount++;
          }
        }

        return { processedCount: users.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
