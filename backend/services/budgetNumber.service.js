const Counter = require('../models/Counter');

async function generateBudgetNumber(workspaceId) {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { workspace: workspaceId, key: `budget_number_${year}` },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `BUD-${year}-${String(counter.sequence).padStart(4, '0')}`;
}

module.exports = { generateBudgetNumber };
