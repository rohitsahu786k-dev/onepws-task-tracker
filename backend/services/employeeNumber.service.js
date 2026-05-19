const Counter = require('../models/Counter');

async function generateEmployeeCode(workspace) {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { workspace, key: `employee_code_${year}` },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `EMP-${year}-${String(counter.sequence).padStart(4, '0')}`;
}

module.exports = { generateEmployeeCode };
