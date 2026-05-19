const MOM = require('../models/MOM');

async function getMetrics(workspace) {
  const [total, draft, pendingSignature, signed, completed] = await Promise.all([
    MOM.countDocuments({ workspace, isDeleted: { $ne: true } }),
    MOM.countDocuments({ workspace, status: 'draft', isDeleted: { $ne: true } }),
    MOM.countDocuments({ workspace, status: { $in: ['sent_for_signature', 'partially_signed'] }, isDeleted: { $ne: true } }),
    MOM.countDocuments({ workspace, status: 'signed', isDeleted: { $ne: true } }),
    MOM.countDocuments({ workspace, status: 'completed', isDeleted: { $ne: true } }),
  ]);

  const points = await MOM.aggregate([
    { $match: { workspace, isDeleted: { $ne: true } } },
    { $unwind: { path: '$actionPoints', preserveNullAndEmptyArrays: false } },
    { $group: { _id: '$actionPoints.status', count: { $sum: 1 } } },
  ]);
  const pointMap = Object.fromEntries(points.map((item) => [item._id, item.count]));

  return {
    total,
    draft,
    pendingSignature,
    signed,
    completed,
    openActionPoints: pointMap.open || 0,
    completedActionPoints: pointMap.completed || pointMap.closed || 0,
    overdueActionPoints: pointMap.overdue || 0,
  };
}

module.exports = { getMetrics };
