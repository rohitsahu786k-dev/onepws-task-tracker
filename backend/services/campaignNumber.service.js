const Counter = require('../models/Counter');

async function nextNumber(workspaceId, keyPrefix, prefix) {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { workspace: workspaceId, key: `${keyPrefix}_${year}` },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );
  return `${prefix}-${year}-${String(counter.sequence).padStart(4, '0')}`;
}

function generateCampaignNumber(workspaceId) {
  return nextNumber(workspaceId, 'campaign_number', 'CMP');
}

function generateContentNumber(workspaceId) {
  return nextNumber(workspaceId, 'content_number', 'CNT');
}

module.exports = { generateCampaignNumber, generateContentNumber };
