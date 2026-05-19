const Campaign = require('../models/Campaign');
const ContentItem = require('../models/ContentItem');

async function getDashboard(workspace) {
  const [total, active, planned, completed, contentThisMonth, pendingApprovals, scheduledThisWeek, publishedThisWeek, overdue] = await Promise.all([
    Campaign.countDocuments({ workspace, isDeleted: { $ne: true } }),
    Campaign.countDocuments({ workspace, status: 'active', isDeleted: { $ne: true } }),
    Campaign.countDocuments({ workspace, status: 'planned', isDeleted: { $ne: true } }),
    Campaign.countDocuments({ workspace, status: 'completed', isDeleted: { $ne: true } }),
    ContentItem.countDocuments({ workspace, createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }, isDeleted: { $ne: true } }),
    ContentItem.countDocuments({ workspace, 'approval.status': 'pending', isDeleted: { $ne: true } }),
    ContentItem.countDocuments({ workspace, status: 'scheduled', scheduledDate: { $lte: new Date(Date.now() + 7 * 86400000) }, isDeleted: { $ne: true } }),
    ContentItem.countDocuments({ workspace, status: 'published', updatedAt: { $gte: new Date(Date.now() - 7 * 86400000) }, isDeleted: { $ne: true } }),
    ContentItem.countDocuments({ workspace, status: { $nin: ['published', 'cancelled', 'archived'] }, scheduledDate: { $lt: new Date() }, isDeleted: { $ne: true } })
  ]);
  return { total, active, planned, completed, contentThisMonth, pendingApprovals, scheduledThisWeek, publishedThisWeek, overdue };
}

module.exports = { getDashboard };
