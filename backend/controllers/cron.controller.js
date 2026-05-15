const asyncHandler = require('../utils/asyncHandler');
const CronJobLog = require('../models/CronJobLog');
const CronLock = require('../models/CronLock');

// @desc    Get all cron jobs status (Derived from locks)
// @route   GET /api/admin/cron/jobs
const getJobsStatus = asyncHandler(async (req, res) => {
  const locks = await CronLock.find({}).sort({ jobName: 1 });
  res.json({ success: true, data: locks });
});

// @desc    Get logs for a specific cron job
// @route   GET /api/admin/cron/jobs/:jobName/logs
const getJobLogs = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const logs = await CronJobLog.find({ jobName: req.params.jobName })
    .sort({ createdAt: -1 })
    .limit(limit);
  res.json({ success: true, data: logs });
});

// @desc    Get all cron logs with filtering and pagination
// @route   GET /api/admin/cron/logs
const getCronLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, jobName, status } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (jobName) query.jobName = new RegExp(jobName, 'i');
  if (status) query.status = status;

  const logs = await CronJobLog.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await CronJobLog.countDocuments(query);

  res.json({
    success: true,
    data: logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get cron dashboard summary
// @route   GET /api/admin/cron/dashboard
const getDashboardSummary = asyncHandler(async (req, res) => {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const totalRuns = await CronJobLog.countDocuments({ 
    createdAt: { $gte: last24h } 
  });

  const successfulRuns = await CronJobLog.countDocuments({
    status: "completed",
    createdAt: { $gte: last24h }
  });

  const failedRuns = await CronJobLog.countDocuments({
    status: "failed",
    createdAt: { $gte: last24h }
  });

  const averageDuration = await CronJobLog.aggregate([
    {
      $match: {
        status: "completed",
        createdAt: { $gte: last24h }
      }
    },
    {
      $group: {
        _id: null,
        avgDuration: { $avg: "$durationMs" }
      }
    }
  ]);

  const recentFailures = await CronJobLog.find({
    status: "failed",
    createdAt: { $gte: last24h }
  }).sort({ createdAt: -1 }).limit(5);

  res.json({
    success: true,
    data: {
      summary: {
        totalRuns,
        successfulRuns,
        failedRuns,
        successRate: totalRuns > 0 ? ((successfulRuns / totalRuns) * 100).toFixed(2) : 0,
        averageDuration: averageDuration[0]?.avgDuration || 0
      },
      recentFailures
    }
  });
});

// @desc    Manually run a job (trigger job execution)
// @route   POST /api/admin/cron/jobs/:jobName/run
const runJobManually = asyncHandler(async (req, res) => {
  const { jobName } = req.params;
  const { runJobByName } = require('../jobs/jobRegistry');

  await CronLock.findOneAndUpdate(
    { jobName },
    { lockedUntil: null, status: 'idle', $unset: { errorMessage: 1 } },
    { upsert: true }
  );

  try {
    await runJobByName(jobName);
    res.json({ success: true, message: `Job ${jobName} executed successfully` });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || `Failed to run job ${jobName}`
    });
  }
});

// @desc    Clear old cron logs
// @route   POST /api/admin/cron/logs/clear
const clearOldLogs = asyncHandler(async (req, res) => {
  const { daysToKeep = 30 } = req.body;
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

  const result = await CronJobLog.deleteMany({ createdAt: { $lt: cutoffDate } });

  res.json({
    success: true,
    message: `Cleared ${result.deletedCount} old cron logs (before ${daysToKeep} days)`,
    deletedCount: result.deletedCount
  });
});

// @desc    Get cron settings
// @route   GET /api/admin/cron/settings
const getCronSettings = asyncHandler(async (req, res) => {
  const SystemSettings = require("../models/SystemSettings");
  
  let settings = await SystemSettings.findOne({});
  
  if (!settings) {
    settings = new SystemSettings({
      automation: {
        enabled: true,
        taskDueTodayTime: "08:00",
        taskDueTomorrowTime: "18:00",
        overdueCheckTime: "09:00",
        dailyDigestTime: "19:00",
        weeklySummaryDay: 1,
        weeklySummaryTime: "09:00",
        slaBreachCheckEnabled: true,
        autoHoldEnabled: true,
        autoCloseEnabled: true,
        backupEnabled: true,
        backupTime: "02:00",
        backupRetentionDays: 30,
        mediaCleanupEnabled: true
      }
    });
    await settings.save();
  }
  
  res.json({ success: true, data: settings.automation || {} });
});

// @desc    Update cron settings
// @route   PUT /api/admin/cron/settings
const updateCronSettings = asyncHandler(async (req, res) => {
  const SystemSettings = require("../models/SystemSettings");
  
  let settings = await SystemSettings.findOne({});
  
  if (!settings) {
    settings = new SystemSettings({ automation: req.body });
  } else {
    settings.automation = { ...settings.automation, ...req.body };
  }
  
  await settings.save();

  res.json({
    success: true,
    message: "Cron settings updated successfully",
    data: settings.automation
  });
});

module.exports = {
  getJobsStatus,
  getJobLogs,
  getCronLogs,
  runJobManually,
  getDashboardSummary,
  clearOldLogs,
  getCronSettings,
  updateCronSettings
};
