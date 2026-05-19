const Counter = require('../models/Counter');

async function generatePaymentNumber(workspaceId) {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { workspace: workspaceId, key: `payment_number_${year}` },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `PAY-${year}-${String(counter.sequence).padStart(4, '0')}`;
}

module.exports = { generatePaymentNumber };
