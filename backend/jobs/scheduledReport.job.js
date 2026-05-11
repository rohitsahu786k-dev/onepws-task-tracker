const cron = require("node-cron");
const dayjs = require("dayjs");
const ReportSchedule = require("../models/ReportSchedule");
const Report = require("../models/Report");
const emailService = require("../services/email.service");
const reportService = require("../services/report.service");
const { runJobWithLog } = require("./cronUtils");

module.exports = function scheduledReportJob() {
  cron.schedule(
    "*/15 * * * *",
    async () => {
      await runJobWithLog("scheduled_report_job", async () => {
        const now = new Date();
        const schedules = await ReportSchedule.find({
          isActive: true,
          nextRunAt: { $lte: now },
          isDeleted: { $ne: true }
        }).populate("reportTemplate");

        let successCount = 0;
        let failedCount = 0;

        for (const schedule of schedules) {
          try {
            // Generate report based on template and filters
            const reportData = await reportService.generateReport({
              template: schedule.reportTemplate,
              filters: schedule.filters,
              workspace: schedule.workspace
            });

            // Create report record
            const report = await Report.create({
              workspace: schedule.workspace,
              reportTemplate: schedule.reportTemplate._id,
              scheduleId: schedule._id,
              title: `${schedule.reportTemplate.name} - ${dayjs().format("DD MMM YYYY")}`,
              data: reportData,
              format: schedule.format || "pdf",
              generatedAt: new Date()
            });

            // Export based on format
            let fileBuffer;
            let fileName;

            if (schedule.format === "excel") {
              fileBuffer = await reportService.exportToExcel(reportData);
              fileName = `${schedule.reportTemplate.name}-${dayjs().format("YYYY-MM-DD")}.xlsx`;
            } else if (schedule.format === "csv") {
              fileBuffer = await reportService.exportToCSV(reportData);
              fileName = `${schedule.reportTemplate.name}-${dayjs().format("YYYY-MM-DD")}.csv`;
            } else {
              fileBuffer = await reportService.exportToPDF(reportData);
              fileName = `${schedule.reportTemplate.name}-${dayjs().format("YYYY-MM-DD")}.pdf`;
            }

            // Send to recipients
            for (const recipient of schedule.recipients || []) {
              await emailService.sendScheduledReport({
                to: recipient.email || recipient,
                subject: `Scheduled Report: ${schedule.reportTemplate.name}`,
                fileName,
                buffer: fileBuffer,
                scheduleFrequency: schedule.frequency
              });
            }

            // Calculate next run date
            const nextRun = calculateNextRun(schedule.frequency, now);
            schedule.lastRunAt = now;
            schedule.nextRunAt = nextRun;
            await schedule.save();

            successCount++;
          } catch (err) {
            console.error(`Scheduled report ${schedule._id} failed`, err);
            schedule.lastError = err.message;
            await schedule.save();
            failedCount++;
          }
        }

        return { processedCount: schedules.length, successCount, failedCount };
      });
    },
    { timezone: process.env.CRON_TIMEZONE || "Asia/Kolkata" }
  );
};

function calculateNextRun(frequency, now) {
  switch (frequency) {
    case "daily":
      return dayjs(now).add(1, "day").toDate();
    case "weekly":
      return dayjs(now).add(1, "week").toDate();
    case "biweekly":
      return dayjs(now).add(2, "week").toDate();
    case "monthly":
      return dayjs(now).add(1, "month").toDate();
    default:
      return dayjs(now).add(1, "day").toDate();
  }
}
