const SLATracker = require('../models/SLATracker');
const SLAEscalation = require('../models/SLAEscalation');

async function getDashboard(workspace) {
  const [total, onTrack, atRisk, breached, completed, onHold, escalationsOpen, capaPending] = await Promise.all([
    SLATracker.countDocuments({ workspace }),
    SLATracker.countDocuments({ workspace, overallStatus: 'on_track' }),
    SLATracker.countDocuments({ workspace, overallStatus: 'at_risk' }),
    SLATracker.countDocuments({ workspace, overallStatus: 'breached' }),
    SLATracker.countDocuments({ workspace, overallStatus: 'completed' }),
    SLATracker.countDocuments({ workspace, overallStatus: 'on_hold' }),
    SLAEscalation.countDocuments({ workspace, status: { $in: ['open', 'acknowledged'] } }),
    SLAEscalation.countDocuments({ workspace, capaStatus: 'pending' }),
  ]);

  const delayAgg = await SLATracker.aggregate([
    { $match: { workspace, totalDelayDays: { $gt: 0 } } },
    { $group: { _id: null, averageDelayDays: { $avg: '$totalDelayDays' } } },
  ]);

  return {
    total,
    onTrack,
    atRisk,
    breached,
    completed,
    onHold,
    averageDelayDays: Number((delayAgg[0]?.averageDelayDays || 0).toFixed(2)),
    escalationsOpen,
    capaPending,
  };
}

module.exports = { getDashboard };
