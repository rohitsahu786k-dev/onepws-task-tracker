const PrintJob = require('../models/PrintJob');
const printJobNumberService = require('./printJobNumber.service');

async function createPrintJob(payload, user) {
  return PrintJob.create({
    ...payload,
    printJobNumber: payload.printJobNumber || await printJobNumberService.generatePrintJobNumber(payload.workspace),
    workspaceModule: payload.project ? 'project' : payload.campaign ? 'campaign' : payload.task ? 'task' : 'standalone',
    requestedBy: payload.requestedBy || user?._id,
    owner: payload.owner || user?._id,
    status: payload.status || (payload.specifications ? 'artwork_pending' : 'spec_pending'),
    createdBy: payload.createdBy || user?._id
  });
}

module.exports = { createPrintJob };
