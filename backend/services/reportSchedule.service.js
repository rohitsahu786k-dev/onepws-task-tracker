const cron = require('node-cron');
const dayjs = require('dayjs');
const ReportSchedule = require('../models/ReportSchedule');
const reportService = require('./report.service');
const reportPdfService = require('./reportPdf.service');
const reportExcelService = require('./reportExcel.service');
const reportCsvService = require('./reportCsv.service');
const reportEmailService = require('./reportEmail.service');

function calculateNextRun(schedule, fromDate = new Date()) {
  const [hour = 9, minute = 0] = String(schedule.scheduleTime || '09:00').split(':').map(Number);
  let next = dayjs(fromDate).hour(hour).minute(minute).second(0).millisecond(0);
  if (!next.isAfter(dayjs(fromDate))) next = next.add(1, 'day');

  if (schedule.frequency === 'weekly') {
    const targetDay = Number.isInteger(schedule.dayOfWeek) ? schedule.dayOfWeek : 1;
    while (next.day() !== targetDay) next = next.add(1, 'day');
  }

  if (schedule.frequency === 'monthly' || schedule.frequency === 'quarterly') {
    const targetDate = Math.min(Math.max(Number(schedule.dayOfMonth || 1), 1), 28);
    next = next.date(targetDate);
    if (!next.isAfter(dayjs(fromDate))) next = next.add(schedule.frequency === 'quarterly' ? 3 : 1, 'month').date(targetDate);
  }

  return next.toDate();
}

async function runSchedule(schedule) {
  const payload = await reportService.buildReportPayload({
    workspace: schedule.workspace,
    reportType: schedule.reportType,
    filters: schedule.filters || {},
    userContext: { user: { globalRole: 'super_admin' }, role: 'super_admin' }
  });

  const files = {};
  if (schedule.formats?.pdf) files.pdf = (await reportPdfService.generatePDF({ reportType: schedule.reportType, title: schedule.name, data: payload.source, summary: payload.summary, chartData: payload.chartData, filters: schedule.filters || {} })).filePath;
  if (schedule.formats?.excel) files.excel = (await reportExcelService.generateExcel({ reportType: schedule.reportType, title: schedule.name, data: payload.source, summary: payload.summary, chartData: payload.chartData, filters: schedule.filters || {} })).filePath;
  if (schedule.formats?.csv) files.csv = (await reportCsvService.generateCSV({ reportType: schedule.reportType, data: payload.source, filters: schedule.filters || {} })).filePath;

  if (schedule.recipients?.length) {
    await reportEmailService.sendScheduledReportEmail({
      workspace: schedule.workspace,
      recipients: schedule.recipients,
      reportType: schedule.reportType,
      filters: schedule.filters,
      files
    });
  }

  schedule.lastRunAt = new Date();
  schedule.nextRunAt = calculateNextRun(schedule, schedule.lastRunAt);
  await schedule.save();
  return { files, summary: payload.summary };
}

let scheduledTask = null;

function start() {
  if (scheduledTask) return scheduledTask;
  scheduledTask = cron.schedule('*/15 * * * *', async () => {
  const schedules = await ReportSchedule.find({ isActive: true, nextRunAt: { $lte: new Date() } });
  for (const schedule of schedules) {
    try {
      await runSchedule(schedule);
    } catch (error) {
      console.error(`Scheduled report failed for ${schedule._id}`, error);
    }
  }
  });
  console.log('Report Schedule Cron started');
  return scheduledTask;
}

module.exports = {
  start,
  calculateNextRun,
  runSchedule
};
