const printJobController = require('./printJob.controller');

module.exports = {
  dashboard: printJobController.dashboard,
  reports: printJobController.reports,
  exportReports: printJobController.reports
};
