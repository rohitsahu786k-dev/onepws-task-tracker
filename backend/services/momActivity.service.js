const MOMActivity = require('../models/MOMActivity');

async function log(payload) {
  if (!payload?.workspace || !payload?.mom || !payload?.action) return null;
  return MOMActivity.create(payload);
}

async function listForMOM(workspace, mom) {
  return MOMActivity.find({ workspace, mom }).populate('performedBy', 'name firstName lastName email avatar').sort({ createdAt: -1 });
}

module.exports = { log, listForMOM };
