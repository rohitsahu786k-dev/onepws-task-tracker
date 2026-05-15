const fs = require('fs');
const ExcelJS = require('exceljs');
const TrackerImport = require('../models/TrackerImport');
const { ensureDefaultTrackerConfig } = require('./trackerDefaultConfig.service');
const { upsertRow } = require('./trackerRow.service');
const { writeTrackerAudit } = require('./trackerAudit.service');

const normalize = (value) => String(value || '').trim().toLowerCase();

const importWorkbook = async ({ workspaceId, file, user }) => {
  if (!file?.path) throw new Error('Excel file is required');

  const config = await ensureDefaultTrackerConfig(workspaceId, user?._id);
  const importLog = await TrackerImport.create({
    workspace: workspaceId,
    config: config._id,
    originalFileName: file.originalname,
    filePath: file.path,
    status: 'processing',
    importedBy: user._id,
    totalRows: 0,
    successRows: 0,
    failedRows: 0,
    errors: [],
  });

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file.path);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('Workbook does not contain a worksheet');

  const fields = [...config.fields].filter((field) => field.fieldType !== 'auto' && !field.isDeleted);
  const byLabel = new Map(fields.map((field) => [normalize(field.label), field.fieldKey]));
  const byKey = new Map(fields.map((field) => [normalize(field.fieldKey), field.fieldKey]));

  const headerRow = sheet.getRow(1);
  const headerKeys = [];
  headerRow.eachCell((cell, colNumber) => {
    const raw = normalize(cell.value);
    headerKeys[colNumber] = byKey.get(raw) || byLabel.get(raw) || raw;
  });

  const secondRowLooksLikeKeys = headerKeys.some((fieldKey, colNumber) => {
    if (!fieldKey) return false;
    return normalize(sheet.getRow(2).getCell(colNumber).value) === normalize(fieldKey);
  });

  let totalRows = 0;
  let successRows = 0;
  const errors = [];

  for (let rowNumber = secondRowLooksLikeKeys ? 3 : 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const excelRow = sheet.getRow(rowNumber);
    const rowData = {};
    let hasValue = false;

    headerKeys.forEach((fieldKey, colNumber) => {
      if (!fieldKey) return;
      let value = excelRow.getCell(colNumber).value;
      if (value && typeof value === 'object' && value.text) value = value.text;
      if (value instanceof Date) value = value.toISOString().slice(0, 10);
      if (value !== undefined && value !== null && value !== '') hasValue = true;
      rowData[fieldKey] = value;
    });

    if (!hasValue) continue;
    totalRows += 1;

    try {
      await upsertRow(workspaceId, config._id, null, rowData, user, { enforceRequired: true });
      successRows += 1;
    } catch (err) {
      errors.push({ rowNumber, message: err.message });
    }
  }

  importLog.totalRows = totalRows;
  importLog.successRows = successRows;
  importLog.failedRows = errors.length;
  importLog.errors = errors;
  importLog.status = errors.length === totalRows && totalRows > 0 ? 'failed' : 'completed';
  await importLog.save();

  await writeTrackerAudit({
    workspace: workspaceId,
    user: user._id,
    action: 'bulk_import',
    rowId: importLog._id,
    refModel: 'TrackerImport',
    newValue: { totalRows, successRows, failedRows: errors.length },
    description: `Tracker import completed: ${successRows}/${totalRows} rows imported`,
  });

  fs.unlink(file.path, () => {});
  return importLog;
};

module.exports = {
  importWorkbook,
};
