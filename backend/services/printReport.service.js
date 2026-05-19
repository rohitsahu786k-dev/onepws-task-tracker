const PrintJob = require('../models/PrintJob');
const PrintJobQuotation = require('../models/PrintJobQuotation');

async function getDashboard(workspace) {
  const [total, active, artworkPending, proofPending, inProduction, readyForDispatch, dispatched, delivered, reprintRequired, quotations] = await Promise.all([
    PrintJob.countDocuments({ workspace, isDeleted: { $ne: true } }),
    PrintJob.countDocuments({ workspace, status: { $nin: ['completed', 'cancelled', 'archived'] }, isDeleted: { $ne: true } }),
    PrintJob.countDocuments({ workspace, status: { $in: ['artwork_pending', 'artwork_review'] }, isDeleted: { $ne: true } }),
    PrintJob.countDocuments({ workspace, status: { $in: ['proof_pending', 'proof_review'] }, isDeleted: { $ne: true } }),
    PrintJob.countDocuments({ workspace, status: 'in_production', isDeleted: { $ne: true } }),
    PrintJob.countDocuments({ workspace, status: 'ready_for_dispatch', isDeleted: { $ne: true } }),
    PrintJob.countDocuments({ workspace, status: 'dispatched', isDeleted: { $ne: true } }),
    PrintJob.countDocuments({ workspace, status: 'delivered', isDeleted: { $ne: true } }),
    PrintJob.countDocuments({ workspace, status: 'reprint_required', isDeleted: { $ne: true } }),
    PrintJobQuotation.find({ workspace, status: 'selected' }).select('totalAmount').lean()
  ]);
  const totalPrintSpend = quotations.reduce((sum, q) => sum + Number(q.totalAmount || 0), 0);
  return { total, active, artworkPending, proofPending, inProduction, readyForDispatch, dispatched, delivered, reprintRequired, totalPrintSpend };
}

module.exports = { getDashboard };
