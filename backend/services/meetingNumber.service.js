const Counter = require('../models/Counter');

async function generateMeetingNumber(workspaceId) {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { workspace: workspaceId, key: `meeting_number_${year}` },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return `MTG-${year}-${String(counter.sequence).padStart(4, '0')}`;
}

module.exports = { generateMeetingNumber };
