const Counter = require('../models/Counter');

async function generateExpenseNumber(workspaceId) {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { workspace: workspaceId, key: `expense_number_${year}` },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `EXP-${year}-${String(counter.sequence).padStart(4, '0')}`;
}

module.exports = { generateExpenseNumber };
