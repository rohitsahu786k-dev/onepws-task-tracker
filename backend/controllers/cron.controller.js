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

// @desc    Manually run a job (mock trigger for now since actual trigger requires calling the function)
// @route   POST /api/admin/cron/jobs/:jobName/run
const runJobManually = asyncHandler(async (req, res) => {
  // Normally, we'd map jobName to the actual imported job function and execute it.
  // For the sake of this mock API:
  const { jobName } = req.params;
  
  // Free up lock just in case
  await CronLock.findOneAndUpdate({ jobName }, { lockedUntil: null, status: 'idle' });

  // Map of job name to function would go here. For now, just return success.
  res.json({ success: true, message: `Job ${jobName} lock released and marked for manual trigger. Execution will be captured in logs shortly.` });
});

module.exports = {
  getJobsStatus,
  getJobLogs,
  runJobManually
};
