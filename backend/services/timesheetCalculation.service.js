const dayjs = require('dayjs');
const TimesheetSettings = require('../models/TimesheetSettings');
const Workspace = require('../models/Workspace');
const Holiday = require('../models/Holiday');

function startOfDay(value) {
  return dayjs(value).startOf('day').toDate();
}

function endOfDay(value) {
  return dayjs(value).endOf('day').toDate();
}

function getWeekNumber(date) {
  const current = dayjs(date).startOf('day');
  const yearStart = dayjs(new Date(current.year(), 0, 1)).startOf('day');
  return Math.ceil((current.diff(yearStart, 'day') + yearStart.day() + 1) / 7);
}

function getPeriodRange({ date = new Date(), periodType = 'weekly', weekStartDay = 'monday' } = {}) {
  const base = dayjs(date);
  if (periodType === 'daily') {
    return { start: startOfDay(base), end: endOfDay(base), weekNumber: getWeekNumber(base) };
  }
  if (periodType === 'monthly') {
    return {
      start: base.startOf('month').toDate(),
      end: base.endOf('month').toDate(),
      month: base.month() + 1,
      year: base.year(),
    };
  }

  const desiredStart = weekStartDay === 'sunday' ? 0 : 1;
  const diff = (base.day() - desiredStart + 7) % 7;
  const start = base.subtract(diff, 'day').startOf('day');
  const end = start.add(6, 'day').endOf('day');
  return { start: start.toDate(), end: end.toDate(), weekNumber: getWeekNumber(start), year: start.year() };
}

async function calculateExpectedMinutes({ workspace, user, periodStart, periodEnd }) {
  const [settings, workspaceDoc, holidays] = await Promise.all([
    TimesheetSettings.findOne({ workspace }),
    Workspace.findById(workspace).select('settings workingDays'),
    Holiday.find({ workspace, date: { $gte: periodStart, $lte: periodEnd }, isActive: { $ne: false } }).select('date'),
  ]);

  const workingDays = workspaceDoc?.workingDays || workspaceDoc?.settings?.workingDays || {};
  const holidayKeys = new Set(holidays.map((holiday) => dayjs(holiday.date).format('YYYY-MM-DD')));
  let expectedMinutes = 0;
  let current = dayjs(periodStart).startOf('day');
  const end = dayjs(periodEnd).startOf('day');

  while (current.isBefore(end) || current.isSame(end, 'day')) {
    const key = current.format('dddd').toLowerCase();
    const defaultWorking = !['saturday', 'sunday'].includes(key);
    const isWorkingDay = workingDays[key] === undefined ? defaultWorking : workingDays[key] !== false;
    const isHoliday = holidayKeys.has(current.format('YYYY-MM-DD'));
    if (isWorkingDay && !isHoliday) expectedMinutes += (settings?.expectedHoursPerDay || 8) * 60;
    current = current.add(1, 'day');
  }

  return expectedMinutes;
}

function groupSummary(logs, key) {
  const groups = new Map();
  logs.forEach((log) => {
    const id = log[key]?.toString();
    if (!id) return;
    groups.set(id, (groups.get(id) || 0) + Number(log.durationMinutes || 0));
  });
  return Array.from(groups.entries()).map(([id, totalMinutes]) => ({
    [key]: id,
    totalMinutes,
    totalHours: Number((totalMinutes / 60).toFixed(2)),
  }));
}

async function buildDailySummary({ logs, period, settings, workspace }) {
  const holidays = await Holiday.find({
    workspace,
    date: { $gte: period.start, $lte: period.end },
    isActive: { $ne: false },
  }).select('date');
  const holidayKeys = new Set(holidays.map((holiday) => dayjs(holiday.date).format('YYYY-MM-DD')));
  const byDate = new Map();
  logs.forEach((log) => {
    const key = dayjs(log.logDate).format('YYYY-MM-DD');
    byDate.set(key, (byDate.get(key) || 0) + Number(log.durationMinutes || 0));
  });

  const rows = [];
  let current = dayjs(period.start).startOf('day');
  const end = dayjs(period.end).startOf('day');
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    const key = current.format('YYYY-MM-DD');
    const dayKey = current.format('dddd').toLowerCase();
    const isWeekend = ['saturday', 'sunday'].includes(dayKey);
    const isHoliday = holidayKeys.has(key);
    const totalMinutes = byDate.get(key) || 0;
    const expectedMinutes = isWeekend || isHoliday ? 0 : (settings?.expectedHoursPerDay || 8) * 60;
    rows.push({
      date: current.toDate(),
      totalMinutes,
      expectedMinutes,
      overtimeMinutes: Math.max(0, totalMinutes - expectedMinutes),
      missingMinutes: Math.max(0, expectedMinutes - totalMinutes),
      status: isHoliday ? 'holiday' : isWeekend ? 'weekend' : totalMinutes >= expectedMinutes ? 'complete' : 'incomplete',
    });
    current = current.add(1, 'day');
  }
  return rows;
}

module.exports = {
  getPeriodRange,
  calculateExpectedMinutes,
  buildDailySummary,
  buildProjectSummary: (logs) => groupSummary(logs, 'project'),
  buildTaskSummary: (logs) => groupSummary(logs, 'task'),
};
