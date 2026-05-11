const cron = require("node-cron");
const { runJobWithLog } = require("./cronUtils");

module.exports = function backupJob() {
  cron.schedule(
    "0 2 * * *",
    async () => {
      await runJobWithLog("backup_job", async () => {
        // Implementation for MongoDB dump and zip creation of 'uploads/'
        // Leaving placeholder as this typically runs shell scripts via child_process
        console.log("Running DB and Media Backup...");
        return { processedCount: 1, successCount: 1, failedCount: 0 };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
