const Counter = require('../models/Counter');

async function generateMOMNumber(workspaceId) {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { workspace: workspaceId, key: `mom_number_${year}` },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `MOM-${year}-${String(counter.sequence).padStart(4, '0')}`;
}

module.exports = { generateMOMNumber };
