const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, requireMinimumRole } = require('../middleware/auth.middleware');
const CronJobLog = require('../models/CronJobLog');
const CronLock = require('../models/CronLock');
const SystemSettings = require('../models/SystemSettings');
const asyncHandler = require('../utils/asyncHandler');
const { runJobByName } = require('../jobs/jobRegistry');

router.use(protect, verifyWorkspaceAccess, requireMinimumRole('admin'));

router.get('/logs', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const logs = await CronJobLog.find({})
    .sort({ createdAt: -1 })
    .limit(limit);
  res.json({ success: true, data: logs });
}));

router.get('/settings', asyncHandler(async (req, res) => {
  const settings = await SystemSettings.findOne({ workspace: req.params.wid }).select('automation');
  res.json({ success: true, data: settings?.automation || {} });
}));

router.put('/settings', asyncHandler(async (req, res) => {
  const settings = await SystemSettings.findOneAndUpdate(
    { workspace: req.params.wid },
    { $set: { automation: req.body, updatedBy: req.user._id } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).select('automation');
  res.json({ success: true, data: settings.automation });
}));

router.get('/jobs', asyncHandler(async (req, res) => {
  const locks = await CronLock.find({}).sort({ jobName: 1 });
  res.json({ success: true, data: locks });
}));

router.post('/run/:jobName', asyncHandler(async (req, res) => {
  await runJobByName(req.params.jobName);
  res.json({ success: true, message: `Job ${req.params.jobName} executed` });
}));

module.exports = router;
