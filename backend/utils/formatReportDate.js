const dayjs = require('dayjs');

function formatReportDate(value, fallback = '') {
  return value ? dayjs(value).format('DD MMM YYYY') : fallback;
}

module.exports = formatReportDate;
