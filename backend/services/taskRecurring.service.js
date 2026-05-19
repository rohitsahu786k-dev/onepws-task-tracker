const dayjs = require('dayjs');
const RecurringTask = require('../models/RecurringTask');
const taskService = require('./task.service');

function getNextRunDate(current, rule) {
  return dayjs(current).add(Math.max(Number(rule.interval) || 1, 1), rule.frequency || 'weekly').toDate();
}

async function runDueRecurringTasks(now = new Date()) {
  const due = await RecurringTask.find({ isActive: true, nextRunAt: { $lte: now }, $or: [{ endDate: null }, { endDate: { $gte: now } }] });
  const created = [];
  for (const recurring of due) {
    const payload = Object.fromEntries(recurring.payload || []);
    const task = await taskService.createTask({ ...payload, workspace: recurring.workspace, sourceModule: 'recurring' }, { _id: recurring.createdBy });
    recurring.lastRunAt = now;
    recurring.nextRunAt = getNextRunDate(recurring.nextRunAt, recurring);
    await recurring.save();
    created.push(task);
  }
  return created;
}

module.exports = { runDueRecurringTasks, getNextRunDate };
