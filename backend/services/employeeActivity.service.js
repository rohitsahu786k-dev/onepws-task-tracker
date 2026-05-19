const EmployeeActivity = require('../models/EmployeeActivity');

async function log(payload) {
  if (!payload?.workspace || !payload?.employee || !payload?.action) return null;
  try {
    return await EmployeeActivity.create(payload);
  } catch (error) {
    console.warn('[employeeActivity] failed:', error.message);
    return null;
  }
}

module.exports = { log };
