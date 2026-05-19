const Task = require('../models/Task');

async function getMetrics(workspace, baseQuery = {}) {
  const query = { workspace, isDeleted: { $ne: true }, ...baseQuery };
  const [total, open, inProgress, submitted, closed, cancelled, overdue, delayed] = await Promise.all([
    Task.countDocuments(query),
    Task.countDocuments({ ...query, status: 'open' }),
    Task.countDocuments({ ...query, status: { $in: ['in_progress', 'in_process'] } }),
    Task.countDocuments({ ...query, status: 'submitted' }),
    Task.countDocuments({ ...query, status: 'closed' }),
    Task.countDocuments({ ...query, status: 'cancelled' }),
    Task.countDocuments({ ...query, isOverdue: true }),
    Task.countDocuments({ ...query, delayStatus: 'delayed' }),
  ]);

  return { total, open, inProgress, submitted, closed, cancelled, overdue, delayed };
}

module.exports = { getMetrics };
