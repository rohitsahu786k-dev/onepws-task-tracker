const taskDueTodayJob = require("./taskDueToday.job");
const taskDueTomorrowJob = require("./taskDueTomorrow.job");
const overdueTaskJob = require("./overdueTask.job");
const slaBreachJob = require("./slaBreach.job");
const mediaCleanupJob = require("./mediaCleanup.job");
const backupJob = require("./backup.job");
const notificationRetryJob = require("./notificationRetry.job");

function registerCronJobs() {
  console.log("Registering Cron Jobs...");
  taskDueTodayJob();
  taskDueTomorrowJob();
  overdueTaskJob();
  slaBreachJob();
  notificationRetryJob();
  mediaCleanupJob();
  backupJob();
  console.log("Cron jobs registered successfully.");
}

module.exports = registerCronJobs;
