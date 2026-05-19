const CampaignActivity = require('../models/CampaignActivity');

async function log(payload) {
  return CampaignActivity.create(payload).catch(() => null);
}

module.exports = { log };
