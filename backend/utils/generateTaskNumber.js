const { TASK_NUMBER_PREFIX } = require('../config/constants');
const Counter = require('../models/Counter');

/**
 * Generate a workspace/year-scoped unique task number: MKT-2026-0001
 */
const generateTaskNumber = async (workspaceId) => {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { workspace: workspaceId, key: `task_number_${year}` },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return `${TASK_NUMBER_PREFIX}-${year}-${String(counter.sequence).padStart(4, '0')}`;
};

module.exports = generateTaskNumber;
