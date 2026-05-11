const Holiday = require('../models/Holiday');
const { WORKING_DAYS } = require('../config/constants');
const dayjs = require('dayjs');

/**
 * Get all holiday dates for a given year as a Set of 'YYYY-MM-DD' strings
 */
const getHolidaySet = async (workspaceId, year) => {
  const start = dayjs(`${year}-01-01`).toDate();
  const end = dayjs(`${year}-12-31`).toDate();

  const holidays = await Holiday.find({
    workspace: workspaceId,
    date: { $gte: start, $lte: end },
  });

  return new Set(holidays.map((h) => dayjs(h.date).format('YYYY-MM-DD')));
};

/**
 * Count working days between two dates (inclusive)
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @param {string} workspaceId - for holidays lookup
 * @returns {number} working days
 */
const calculateWorkingDays = async (startDate, endDate, workspaceId) => {
  let current = dayjs(startDate);
  const end = dayjs(endDate);
  const year = current.year();

  const holidaySet = workspaceId ? await getHolidaySet(workspaceId, year) : new Set();

  let count = 0;
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    const dow = current.day(); // 0 = Sun, 6 = Sat
    const dateStr = current.format('YYYY-MM-DD');
    if (WORKING_DAYS.includes(dow) && !holidaySet.has(dateStr)) {
      count++;
    }
    current = current.add(1, 'day');
  }

  return count;
};

/**
 * Add N working days to a date
 */
const addWorkingDays = async (startDate, days, workspaceId) => {
  let current = dayjs(startDate);
  const year = current.year();
  const holidaySet = workspaceId ? await getHolidaySet(workspaceId, year) : new Set();

  let remaining = days;
  while (remaining > 0) {
    current = current.add(1, 'day');
    const dow = current.day();
    const dateStr = current.format('YYYY-MM-DD');
    if (WORKING_DAYS.includes(dow) && !holidaySet.has(dateStr)) {
      remaining--;
    }
  }

  return current.toDate();
};

module.exports = { calculateWorkingDays, addWorkingDays };
