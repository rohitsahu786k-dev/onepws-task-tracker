const Counter = require('../models/Counter');

async function generateReportNumber(workspace) {
  const counter = await Counter.findOneAndUpdate(
    { workspace, key: 'report' },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `RPT-${new Date().getFullYear()}-${String(counter.sequence).padStart(5, '0')}`;
}

module.exports = generateReportNumber;
