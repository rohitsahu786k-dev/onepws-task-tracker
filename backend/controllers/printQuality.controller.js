const asyncHandler = require('../utils/asyncHandler');
const PrintJob = require('../models/PrintJob');
const PrintQualityCheck = require('../models/PrintQualityCheck');
const printQualityService = require('../services/printQuality.service');

const workspaceId = (req) => req.workspace._id;

const create = asyncHandler(async (req, res) => {
  const qualityCheck = await PrintQualityCheck.create({
    ...req.body,
    workspace: workspaceId(req),
    printJob: req.params.printJobId,
    checkedBy: req.user._id,
    checkedAt: req.body.checkedAt || new Date()
  });
  await PrintJob.findOneAndUpdate(
    { _id: req.params.printJobId, workspace: workspaceId(req) },
    { status: printQualityService.statusToPrintJobStatus(qualityCheck.finalStatus) }
  );
  res.status(201).json({ success: true, data: qualityCheck, qualityCheck });
});

module.exports = { create };
