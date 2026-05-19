const Timesheet = require('../models/Timesheet');
const TimeLog = require('../models/TimeLog');
const TimesheetSettings = require('../models/TimesheetSettings');
const {
  getPeriodRange,
  calculateExpectedMinutes,
  buildDailySummary,
  buildProjectSummary,
  buildTaskSummary,
} = require('./timesheetCalculation.service');

async function getSettings(workspace) {
  return TimesheetSettings.findOneAndUpdate(
    { workspace },
    { $setOnInsert: { workspace } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function syncTimesheetForDate({ workspace, user, department, date }) {
  const settings = await getSettings(workspace);
  const period = getPeriodRange({
    date,
    periodType: settings.periodType || 'weekly',
    weekStartDay: settings.weekStartDay || 'monday',
  });

  let timesheet = await Timesheet.findOne({ workspace, user, periodStart: period.start, periodEnd: period.end });
  if (!timesheet) {
    timesheet = await Timesheet.create({
      workspace,
      user,
      department,
      periodType: settings.periodType || 'weekly',
      periodStart: period.start,
      periodEnd: period.end,
      weekNumber: period.weekNumber,
      month: period.month,
      year: period.year,
      status: 'draft',
    });
  }

  const logs = await TimeLog.find({
    workspace,
    user,
    logDate: { $gte: period.start, $lte: period.end },
    isDeleted: { $ne: true },
  });

  const totalMinutes = logs.reduce((sum, log) => sum + Number(log.durationMinutes || 0), 0);
  const billableMinutes = logs.filter((log) => log.billable).reduce((sum, log) => sum + Number(log.durationMinutes || 0), 0);
  const expectedMinutes = await calculateExpectedMinutes({ workspace, user, periodStart: period.start, periodEnd: period.end });

  timesheet.department = timesheet.department || department;
  timesheet.totalMinutes = totalMinutes;
  timesheet.totalHours = Number((totalMinutes / 60).toFixed(2));
  timesheet.billableMinutes = billableMinutes;
  timesheet.nonBillableMinutes = Math.max(0, totalMinutes - billableMinutes);
  timesheet.expectedMinutes = expectedMinutes;
  timesheet.overtimeMinutes = Math.max(0, totalMinutes - expectedMinutes);
  timesheet.missingMinutes = Math.max(0, expectedMinutes - totalMinutes);
  timesheet.dailySummary = await buildDailySummary({ logs, period, settings, workspace });
  timesheet.projectSummary = buildProjectSummary(logs);
  timesheet.taskSummary = buildTaskSummary(logs);

  await TimeLog.updateMany(
    { workspace, user, logDate: { $gte: period.start, $lte: period.end }, isDeleted: { $ne: true } },
    { $set: { timesheet: timesheet._id } }
  );

  await timesheet.save();
  return timesheet;
}

async function resolveApprover({ userDoc, workspaceRole }) {
  if (userDoc?.manager) return userDoc.manager;
  if (userDoc?.reportsTo) return userDoc.reportsTo;
  return workspaceRole === 'manager' ? userDoc?._id : null;
}

module.exports = {
  getSettings,
  syncTimesheetForDate,
  getPeriodRange,
  resolveApprover,
};
