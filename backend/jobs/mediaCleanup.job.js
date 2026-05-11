const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const { runJobWithLog } = require("./cronUtils");

module.exports = function mediaCleanupJob() {
  cron.schedule(
    "0 0 * * *",
    async () => {
      await runJobWithLog("media_cleanup_job", async () => {
        const archivesDir = path.join(process.cwd(), "uploads", "workspaces");
        let processedCount = 0;
        let successCount = 0;

        if (fs.existsSync(archivesDir)) {
          const workspaces = fs.readdirSync(archivesDir);
          for (const wid of workspaces) {
            const archivePath = path.join(archivesDir, wid, "media", "archives");
            if (fs.existsSync(archivePath)) {
              const files = fs.readdirSync(archivePath);
              files.forEach((file) => {
                processedCount++;
                const filePath = path.join(archivePath, file);
                const stats = fs.statSync(filePath);
                const now = new Date().getTime();
                const endTime = new Date(stats.ctime).getTime() + 24 * 60 * 60 * 1000;
                if (now > endTime) {
                  fs.unlinkSync(filePath);
                  successCount++;
                }
              });
            }
          }
        }
        return { processedCount, successCount, failedCount: 0 };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
