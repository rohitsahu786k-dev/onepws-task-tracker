const cron = require("node-cron");
const dayjs = require("dayjs");
const MediaFile = require("../models/MediaFile");
const { runJobWithLog } = require("./cronUtils");

module.exports = function expiredPublicLinkCleanupJob() {
  cron.schedule(
    "0 3 * * *",
    async () => {
      await runJobWithLog("expired_public_link_cleanup_job", async () => {
        const now = new Date();
        const mediaFiles = await MediaFile.find({
          publicExpiresAt: { $exists: true, $lt: now },
          isPublic: true,
          isDeleted: { $ne: true }
        });

        let successCount = 0;
        let failedCount = 0;

        for (const file of mediaFiles) {
          try {
            file.isPublic = false;
            file.publicToken = null;
            file.publicExpiresAt = null;
            await file.save();

            successCount++;
          } catch (err) {
            console.error(`Failed to cleanup expired public link for ${file._id}`, err);
            failedCount++;
          }
        }

        return { processedCount: mediaFiles.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};
