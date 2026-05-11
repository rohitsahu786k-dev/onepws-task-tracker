const dayjs = require("dayjs");
const CronLock = require("../models/CronLock");
const CronJobLog = require("../models/CronJobLog");

async function acquireLock(jobName, lockMinutes = 10) {
  const now = new Date();
  const lockedUntil = dayjs().add(lockMinutes, "minute").toDate();

  const lock = await CronLock.findOneAndUpdate(
    {
      jobName,
      $or: [
        { lockedUntil: { $lt: now } },
        { lockedUntil: null }
      ]
    },
    {
      jobName,
      lockedUntil,
      lockedBy: process.env.INSTANCE_ID || "server-1",
      lastRunAt: now,
      status: "running"
    },
    { new: true, upsert: true }
  );
  return lock;
}

async function releaseLock(jobName, error = null) {
  await CronLock.findOneAndUpdate(
    { jobName },
    {
      lockedUntil: null,
      lastCompletedAt: new Date(),
      status: error ? "failed" : "idle",
      errorMessage: error ? error.message : null
    }
  );
}

async function runJobWithLog(jobName, handler) {
  const lock = await acquireLock(jobName, 30);
  if (!lock) {
    console.log(`Job ${jobName} is already locked/running.`);
    return;
  }

  const log = await CronJobLog.create({
    jobName,
    status: "started",
    startedAt: new Date()
  });

  const startTime = Date.now();

  try {
    const result = await handler();

    log.status = "completed";
    log.completedAt = new Date();
    log.durationMs = Date.now() - startTime;
    log.processedCount = result?.processedCount || 0;
    log.successCount = result?.successCount || 0;
    log.failedCount = result?.failedCount || 0;
    log.metadata = result?.metadata || {};

    await log.save();
    await releaseLock(jobName);
  } catch (error) {
    log.status = "failed";
    log.completedAt = new Date();
    log.durationMs = Date.now() - startTime;
    log.errorMessage = error.message;
    log.errorStack = error.stack;

    await log.save();
    await releaseLock(jobName, error);
    console.error(`Cron Job ${jobName} Failed:`, error);
  }
}

module.exports = {
  acquireLock,
  releaseLock,
  runJobWithLog
};
