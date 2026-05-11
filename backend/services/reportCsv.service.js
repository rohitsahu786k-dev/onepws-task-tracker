const { Parser } = require('json2csv');
const fs = require('fs');
const { buildReportFileName, reportUploadPath } = require('../utils/reportFileName');

const dir = reportUploadPath('csv');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function normalizeRows(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.tasks)) return data.tasks;
  if (Array.isArray(data?.budgets)) return data.budgets;
  if (Array.isArray(data?.expenses)) return data.expenses;
  return [];
}

function flattenValue(value) {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(flattenValue).join(', ');
  if (typeof value === 'object') return value.name || value.title || value.taskNumber || value.email || value._id || JSON.stringify(value);
  return value;
}

function flattenRow(row, reportType) {
  if (reportType === 'daily_tracker') {
    return {
      'S.No.': row.calculatedData?.serial_no || row.rowNumber || '',
      'Task Number': row.rowData?.task_number || row.task?.taskNumber || '',
      'Task Receipt Date': row.rowData?.task_receipt_date || '',
      'Task Handled By': row.rowData?.task_handled_by_name || '',
      'Task Given By Department': row.rowData?.task_given_by_department_name || '',
      'Type Of Task': row.rowData?.type_of_task || '',
      'Type Of Product': row.rowData?.type_of_product || '',
      'Target Due Date': row.calculatedData?.my_target_due_date || '',
      'Actual Closing Date': row.rowData?.actual_closing_date || '',
      'Delay/In Time': row.calculatedData?.delay_in_time || '',
      'Final Status': row.rowData?.final_status || row.status || ''
    };
  }

  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, flattenValue(value)]));
}

async function generateCSV({ reportType, data, filters = {} }) {
  const fileName = buildReportFileName({ reportType, dateFrom: filters.dateFrom, dateTo: filters.dateTo, ext: 'csv' });
  const filePath = `${dir}/${fileName}`;
  const rows = normalizeRows(data).map((row) => flattenRow(row, reportType));
  const parser = new Parser();
  fs.writeFileSync(filePath, rows.length ? parser.parse(rows) : '');
  return { filePath, fileUrl: `/uploads/reports/csv/${fileName}` };
}

async function generateTrackerCSV({ data, filters }) {
  return generateCSV({ reportType: 'daily_tracker', data, filters });
}

module.exports = {
  generateCSV,
  generateTrackerCSV
};
