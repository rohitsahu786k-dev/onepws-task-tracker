const Campaign = require('../models/Campaign');
const ContentItem = require('../models/ContentItem');

async function recalculateCampaignPerformance(campaignId) {
  if (!campaignId) return null;

  const items = await ContentItem.find({ campaign: campaignId, isDeleted: { $ne: true } });
  const performance = items.reduce((acc, item) => {
    acc.impressions += item.performance?.impressions || 0;
    acc.reach += item.performance?.reach || 0;
    acc.engagement += (item.performance?.likes || 0) + (item.performance?.comments || 0) + (item.performance?.shares || 0);
    acc.clicks += item.performance?.clicks || 0;
    acc.leads += item.performance?.leads || 0;
    acc.conversions += item.performance?.conversions || 0;
    acc.spend += item.performance?.spend || 0;
    return acc;
  }, { impressions: 0, reach: 0, engagement: 0, clicks: 0, leads: 0, conversions: 0, spend: 0 });

  performance.roi = performance.spend ? Number(((performance.conversions / performance.spend) * 100).toFixed(2)) : 0;
  await Campaign.findByIdAndUpdate(campaignId, { performance, actualSpend: performance.spend });
  return performance;
}

module.exports = { recalculateCampaignPerformance };
