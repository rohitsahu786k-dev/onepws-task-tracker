const ExcelJS = require('exceljs');
const fs = require('fs');
const { buildReportFileName, reportUploadPath } = require('../utils/reportFileName');

const dir = reportUploadPath('excel');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function normalizeRows(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.tasks)) return data.tasks;
  if (Array.isArray(data?.budgets)) return data.budgets;
  if (Array.isArray(data?.expenses)) return data.expenses;
  return [];
}

function displayValue(value) {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.map(displayValue).join(', ');
  if (typeof value === 'object') return value.name || value.title || value.taskNumber || value.email || value._id?.toString?.() || '';
  return value;
}

function trackerRow(row) {
  return {
    serial_no: row.calculatedData?.serial_no || row.rowNumber || '',
    task_number: row.rowData?.task_number || row.task?.taskNumber || '',
    task_receipt_date: row.rowData?.task_receipt_date || '',
    task_provided_by: row.rowData?.task_provided_by || '',
    task_handled_by: row.rowData?.task_handled_by_name || '',
    department: row.rowData?.task_given_by_department_name || '',
    type_of_task: row.rowData?.type_of_task || '',
    target_due_date: row.calculatedData?.my_target_due_date || '',
    actual_closing_date: row.rowData?.actual_closing_date || '',
    delay_in_task_closure: row.calculatedData?.delay_in_task_closure || '',
    delay_in_time: row.calculatedData?.delay_in_time || '',
    type_of_product: row.rowData?.type_of_product || '',
    remark_if_pending: row.rowData?.remark_if_pending || '',
    final_status: row.rowData?.final_status || row.status || ''
  };
}

function genericRow(row) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, displayValue(value)]));
}

function addRowsSheet(workbook, name, rows, mapper) {
  const sheet = workbook.addWorksheet(name);
  const mapped = rows.map(mapper);
  const keys = Object.keys(mapped[0] || { message: '' });
  sheet.columns = keys.map((key) => ({ header: key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()), key, width: 22 }));
  mapped.forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  if (keys.length) sheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + Math.min(keys.length, 26))}1` };
  return sheet;
}

async function generateExcel({ reportType, title, data, summary = {}, chartData = {}, filters = {} }) {
  const fileName = buildReportFileName({ reportType, dateFrom: filters.dateFrom, dateTo: filters.dateTo, ext: 'xlsx' });
  const filePath = `${dir}/${fileName}`;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ONEPWS Marketing Workflow System';
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.addRow(['ONEPWS Marketing Workflow System']);
  summarySheet.addRow([title || reportType]);
  summarySheet.addRow(['Generated At', new Date().toLocaleString()]);
  summarySheet.addRow([]);
  summarySheet.addRow(['Metric', 'Value']);
  Object.entries(summary || {}).forEach(([key, value]) => summarySheet.addRow([key, displayValue(value)]));
  summarySheet.getColumn(1).width = 30;
  summarySheet.getColumn(2).width = 22;
  summarySheet.getRow(1).font = { bold: true, size: 14 };
  summarySheet.getRow(5).font = { bold: true };

  const rows = normalizeRows(data);
  addRowsSheet(workbook, 'Detailed Data', rows, reportType === 'daily_tracker' ? trackerRow : genericRow);

  const chartSheet = workbook.addWorksheet('Charts Data');
  Object.entries(chartData || {}).forEach(([key, values]) => {
    chartSheet.addRow([key]);
    chartSheet.addRow(['Name', 'Value']);
    (values || []).forEach((item) => chartSheet.addRow([item.name || item.month, item.value ?? item.received ?? '']));
    chartSheet.addRow([]);
  });

  await workbook.xlsx.writeFile(filePath);
  return { filePath, fileUrl: `/uploads/reports/excel/${fileName}` };
}

async function generateTrackerExcel({ data, summary, chartData, filters }) {
  return generateExcel({ reportType: 'daily_tracker', title: 'Daily Tracker Report', data, summary, chartData, filters });
}

module.exports = {
  generateExcel,
  generateTrackerExcel
};
