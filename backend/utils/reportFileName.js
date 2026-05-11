const path = require('path');

function safePart(value) {
  return String(value || '')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

function buildReportFileName({ reportType, dateFrom, dateTo, ext }) {
  const range = dateFrom || dateTo ? `${dateFrom || 'start'}_to_${dateTo || 'now'}` : new Date().toISOString().slice(0, 10);
  return `ONEPWS_${safePart(reportType)}_${safePart(range)}_${Date.now()}.${ext}`;
}

function reportUploadPath(...parts) {
  return path.join(__dirname, '../uploads/reports', ...parts);
}

module.exports = { buildReportFileName, reportUploadPath };
