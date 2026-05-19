const taskDueTodayJob = require("./taskDueToday.job");
const taskDueTomorrowJob = require("./taskDueTomorrow.job");
const overdueTaskJob = require("./overdueTask.job");
const slaBreachJob = require("./slaBreach.job");
const slaEscalationJob = require("./slaEscalation.job");
const meetingReminderJob = require("./meetingReminder.job");
const calendarReminderJob = require("./calendarReminder.job");
const momSignatureReminderJob = require("./momSignatureReminder.job");
const feedbackPendingJob = require("./feedbackPending.job");
const autoHoldJob = require("./autoHold.job");
const autoCloseJob = require("./autoClose.job");
const dailyDigestJob = require("./dailyDigest.job");
const weeklySummaryJob = require("./weeklySummary.job");
const scheduledReportJob = require("./scheduledReport.job");
const recurringTaskJob = require("./recurringTask.job");
const recurringCalendarEventJob = require("./recurringCalendarEvent.job");
const trackerDelayCheckJob = require("./trackerDelayCheck.job");
const budgetAlertJob = require("./budgetAlert.job");
const expenseApprovalReminderJob = require("./expenseApprovalReminder.job");
const projectDeadlineJob = require("./projectDeadline.job");
const intakeReviewReminderJob = require("./intakeReviewReminder.job");
const mediaCleanupJob = require("./mediaCleanup.job");
const backupJob = require("./backup.job");
const notificationRetryJob = require("./notificationRetry.job");
const expiredPublicLinkCleanupJob = require("./expiredPublicLinkCleanup.job");
const wikiReviewDueJob = require("./wikiReviewDue.job");
const webhookRetryJob = require("./webhookRetry.job");
const apiKeyExpiryJob = require("./apiKeyExpiry.job");

function registerCronJobs() {
  console.log("Registering Cron Jobs...");
  
  // Task reminders (5 minute, hourly, daily)
  taskDueTodayJob();
  taskDueTomorrowJob();
  overdueTaskJob();
  
  // SLA jobs (hourly)
  slaBreachJob();
  slaEscalationJob();
  
  // Meeting and calendar reminders (5 minute intervals)
  meetingReminderJob();
  calendarReminderJob();
  
  // MOM reminders (9:30 AM)
  momSignatureReminderJob();
  
  // Feedback and task status jobs
  feedbackPendingJob();
  autoHoldJob();
  autoCloseJob();
  
  // Digest and summary jobs
  dailyDigestJob();
  weeklySummaryJob();
  
  // Report and scheduler jobs
  scheduledReportJob();
  
  // Recurring jobs (midnight)
  recurringTaskJob();
  recurringCalendarEventJob();
  
  // Tracker and project jobs
  trackerDelayCheckJob();
  projectDeadlineJob();
  
  // Budget and expense jobs
  budgetAlertJob();
  expenseApprovalReminderJob();
  
  // Intake review reminders
  intakeReviewReminderJob();
  
  // Maintenance jobs
  mediaCleanupJob();
  backupJob();
  notificationRetryJob();
  expiredPublicLinkCleanupJob();
  wikiReviewDueJob();
  
  // API Key & Webhook jobs
  webhookRetryJob();
  apiKeyExpiryJob();
  
  console.log("✓ All cron jobs registered successfully.");
}

module.exports = registerCronJobs;
