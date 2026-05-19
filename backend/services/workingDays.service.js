const dayjs = require('dayjs');
const Workspace = require('../models/Workspace');
const Holiday = require('../models/Holiday');

const DEFAULT_WORKING_DAYS = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: false,
  sunday: false,
};

const dayName = (date) => dayjs(date).format('dddd').toLowerCase();

async function getPolicy(workspaceId) {
  const workspace = workspaceId ? await Workspace.findById(workspaceId).lean() : null;
  const workingDays = {
    ...DEFAULT_WORKING_DAYS,
    ...(workspace?.settings?.workingDays || {}),
  };
  const holidays = workspaceId ? await Holiday.find({ workspace: workspaceId }).select('date').lean() : [];
  const holidaySet = new Set(holidays.map((holiday) => dayjs(holiday.date).format('YYYY-MM-DD')));
  return { workingDays, holidaySet };
}

async function isWorkingDay(workspaceId, date) {
  const { workingDays, holidaySet } = await getPolicy(workspaceId);
  const current = dayjs(date);
  return workingDays[dayName(current)] !== false && !holidaySet.has(current.format('YYYY-MM-DD'));
}

function addWorkingDays(workspaceIdOrDate, dateOrDays, maybeDays) {
  const legacyCall = maybeDays === undefined;
  const workspaceId = legacyCall ? null : workspaceIdOrDate;
  const startDate = legacyCall ? workspaceIdOrDate : dateOrDays;
  const days = Number(legacyCall ? dateOrDays : maybeDays) || 0;

  if (legacyCall) {
    const result = new Date(startDate);
    let remaining = days;
    while (remaining > 0) {
      result.setDate(result.getDate() + 1);
      if (!isWeekend(result)) remaining -= 1;
    }
    return result;
  }

  return (async () => {
  let current = dayjs(startDate).startOf('day');
  let added = 0;
  const { workingDays, holidaySet } = await getPolicy(workspaceId);

  while (added < days) {
    current = current.add(1, 'day');
    const isWorkday = workingDays[dayName(current)] !== false;
    const isHoliday = holidaySet.has(current.format('YYYY-MM-DD'));
    if (isWorkday && !isHoliday) added += 1;
  }

  return current.toDate();
  })();
}

async function calculateWorkingDayDelay(workspaceId, dueDate, actualDate = new Date()) {
  if (!dueDate || !actualDate) return 0;
  const due = dayjs(dueDate).startOf('day');
  const actual = dayjs(actualDate).startOf('day');
  if (!actual.isAfter(due)) return 0;

  const { workingDays, holidaySet } = await getPolicy(workspaceId);
  let current = due;
  let delay = 0;

  while (current.isBefore(actual, 'day')) {
    current = current.add(1, 'day');
    const isWorkday = workingDays[dayName(current)] !== false;
    const isHoliday = holidaySet.has(current.format('YYYY-MM-DD'));
    if (isWorkday && !isHoliday) delay += 1;
  }

  return delay;
}

function isWeekend(date) {
  return [0, 6].includes(new Date(date).getDay());
}

module.exports = {
  isWeekend,
  isWorkingDay,
  addWorkingDays,
  calculateWorkingDayDelay,
};
