const asyncHandler = require('../utils/asyncHandler');
const TrackerFieldConfig = require('../models/TrackerFieldConfig');
const TrackerRow = require('../models/TrackerRow');
const TrackerImport = require('../models/TrackerImport');
const { upsertRow, updateCell } = require('../services/trackerRow.service');
const { addField, updateField, hideField, reorderFields } = require('../services/trackerConfig.service');
const { ensureDefaultTrackerConfig } = require('../services/trackerDefaultConfig.service');
const { importWorkbook } = require('../services/trackerImport.service');
const { writeWorkbook, writeTemplate, writePdf } = require('../services/trackerExport.service');
const { getSummaryReport } = require('../services/trackerReport.service');
const { writeTrackerAudit } = require('../services/trackerAudit.service');

const actor = (req) => Object.assign(req.user || {}, { workspaceRole: req.workspaceRole });

// ── CONFIG ──────────────────────────────────────────────────────────────────

const getConfig = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  let config = await TrackerFieldConfig.findOne({ workspace: wid, isDefault: true });
  if (!config) config = await TrackerFieldConfig.findOne({ workspace: wid });
  if (!config) config = await ensureDefaultTrackerConfig(wid, req.user?._id);
  res.json({ success: true, config, data: config });
});

const createConfig = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  const config = await TrackerFieldConfig.create({
    workspace: wid,
    name: req.body.name || 'Marketing Daily Task Tracker',
    description: req.body.description,
    fields: req.body.fields || [],
    isDefault: req.body.isDefault ?? false,
    isActive: true,
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, config, data: config });
});

const updateConfig = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  const configId = req.params.id || req.body.configId;
  const config = await TrackerFieldConfig.findOne({ _id: configId, workspace: wid });
  if (!config) return res.status(404).json({ success: false, message: 'Config not found' });

  if (req.body.name !== undefined) config.name = req.body.name;
  if (req.body.description !== undefined) config.description = req.body.description;
  if (Array.isArray(req.body.fields)) {
    config.fields = req.body.fields.map((incoming, index) => {
      const incomingId = incoming.fieldId || incoming._id?.toString?.();
      const existing = config.fields.find((field) =>
        field.fieldId === incomingId
        || field._id?.toString() === incomingId
        || field.fieldKey === incoming.fieldKey
      );

      return {
        ...incoming,
        fieldId: existing?.fieldId || incoming.fieldId,
        fieldKey: existing?.fieldKey || incoming.fieldKey,
        order: incoming.order || index + 1,
      };
    });
  }
  config.updatedBy = req.user._id;
  await config.save();

  res.json({ success: true, config, data: config });
});

// ── FIELDS ──────────────────────────────────────────────────────────────────

const addConfigField = asyncHandler(async (req, res) => {
  const baseConfig = req.body.configId
    ? await TrackerFieldConfig.findOne({ _id: req.body.configId, workspace: req.params.wid })
    : await ensureDefaultTrackerConfig(req.params.wid, req.user?._id);
  const config = await addField(baseConfig._id, req.body.fieldData || req.body, req.user);
  await writeTrackerAudit({
    workspace: req.params.wid,
    user: req.user._id,
    action: 'field_added',
    refModel: 'TrackerFieldConfig',
    rowId: config._id,
    newValue: req.body.fieldData || req.body,
    description: 'Tracker field added',
  });
  res.json({ success: true, config, data: config });
});

const updateConfigField = asyncHandler(async (req, res) => {
  const baseConfig = req.body.configId
    ? await TrackerFieldConfig.findOne({ _id: req.body.configId, workspace: req.params.wid })
    : await ensureDefaultTrackerConfig(req.params.wid, req.user?._id);
  const config = await updateField(baseConfig._id, req.params.fieldId, req.body.updateData || req.body, req.user);
  await writeTrackerAudit({
    workspace: req.params.wid,
    user: req.user._id,
    action: 'field_updated',
    refModel: 'TrackerFieldConfig',
    rowId: config._id,
    fieldKey: req.params.fieldId,
    newValue: req.body.updateData || req.body,
    description: 'Tracker field updated',
  });
  res.json({ success: true, config, data: config });
});

const deleteConfigField = asyncHandler(async (req, res) => {
  const baseConfig = req.body.configId
    ? await TrackerFieldConfig.findOne({ _id: req.body.configId, workspace: req.params.wid })
    : await ensureDefaultTrackerConfig(req.params.wid, req.user?._id);
  const config = await hideField(baseConfig._id, req.params.fieldId, req.user);
  await writeTrackerAudit({
    workspace: req.params.wid,
    user: req.user._id,
    action: 'field_removed',
    refModel: 'TrackerFieldConfig',
    rowId: config._id,
    fieldKey: req.params.fieldId,
    description: 'Tracker field archived',
  });
  res.json({ success: true, config, data: config });
});

const reorderConfigFields = asyncHandler(async (req, res) => {
  const baseConfig = req.body.configId
    ? await TrackerFieldConfig.findOne({ _id: req.body.configId, workspace: req.params.wid })
    : await ensureDefaultTrackerConfig(req.params.wid, req.user?._id);
  const config = await reorderFields(baseConfig._id, req.body.reorderData || req.body.fields || [], req.user);
  await writeTrackerAudit({
    workspace: req.params.wid,
    user: req.user._id,
    action: 'field_reordered',
    refModel: 'TrackerFieldConfig',
    rowId: config._id,
    newValue: req.body.reorderData || req.body.fields || [],
    description: 'Tracker fields reordered',
  });
  res.json({ success: true, config, data: config });
});

// ── ROWS ────────────────────────────────────────────────────────────────────

const getRows = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  let configId = req.query.configId;
  if (!configId) {
    const config = await ensureDefaultTrackerConfig(wid, req.user?._id);
    configId = config?._id;
  }
  const query = { config: configId, workspace: wid, isDeleted: { $ne: true } };
  if (req.query.final_status) query['rowData.final_status'] = req.query.final_status;
  if (req.query.task_handled_by) query['rowData.task_handled_by'] = req.query.task_handled_by;
  if (req.query.task_provided_by) query['rowData.task_provided_by'] = req.query.task_provided_by;
  if (req.query.task_given_by_department) query['rowData.task_given_by_department'] = req.query.task_given_by_department;
  if (req.query.type_of_task) query['rowData.type_of_task'] = req.query.type_of_task;
  if (req.query.type_of_product) query['rowData.type_of_product'] = req.query.type_of_product;
  if (req.query.delay_status) query['calculatedData.delay_in_time'] = new RegExp(req.query.delay_status, 'i');
  if (req.query.search) {
    const search = new RegExp(req.query.search, 'i');
    query.$or = [
      { 'rowData.type_of_task': search },
      { 'rowData.remark_if_pending': search },
      { 'calculatedData.task_number': search },
      { 'calculatedData.delay_in_time': search },
    ];
  }
  if (req.workspaceRole === 'manager' && req.workspaceDepartment) {
    query.$or = [
      { 'rowData.task_given_by_department': req.workspaceDepartment.toString() },
      { createdBy: req.user._id },
      { updatedBy: req.user._id }
    ];
  } else if (req.workspaceRole === 'member') {
    query.$or = [
      { 'rowData.task_handled_by': req.user._id.toString() },
      { createdBy: req.user._id },
      { updatedBy: req.user._id }
    ];
  }

  const rows = await TrackerRow.find(query)
    .populate('task', 'taskNumber status')
    .sort({ rowNumber: 1 });
  res.json({ success: true, rows, data: rows });
});

const getRowById = asyncHandler(async (req, res) => {
  const row = await TrackerRow.findOne({ _id: req.params.rowId, workspace: req.params.wid, isDeleted: { $ne: true } });
  res.json({ success: true, row, data: row });
});

const createRow = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  let { configId, rowData } = req.body;
  if (!configId) {
    const config = await ensureDefaultTrackerConfig(wid, req.user?._id);
    configId = config?._id;
  }
  const result = await upsertRow(wid, configId, null, rowData || {}, actor(req));
  res.status(201).json({ success: true, ...result, data: result });
});

const updateRow = asyncHandler(async (req, res) => {
  const { wid, rowId } = req.params;
  let { configId, rowData } = req.body;
  if (!configId) {
    const row = await TrackerRow.findOne({ _id: rowId, workspace: wid });
    configId = row?.config;
  }
  const result = await upsertRow(wid, configId, rowId, rowData || {}, actor(req));
  res.json({ success: true, ...result, data: result });
});

const patchCell = asyncHandler(async (req, res) => {
  const { wid, rowId } = req.params;
  const { fieldKey, value } = req.body;
  const result = await updateCell(wid, rowId, fieldKey, value, actor(req));
  res.json({ success: true, message: "Cell updated successfully", data: result });
});

const deleteRow = asyncHandler(async (req, res) => {
  const { rowId } = req.params;
  // Soft delete logic
  await TrackerRow.findOneAndUpdate({ _id: rowId, workspace: req.params.wid }, { isDeleted: true, deletedAt: new Date(), deletedBy: req.user._id });
  await writeTrackerAudit({
    workspace: req.params.wid,
    user: req.user._id,
    action: 'row_deleted',
    rowId,
    description: 'Tracker row moved to trash',
  });
  res.json({ success: true, message: 'Row deleted successfully' });
});

const submitRow = asyncHandler(async (req, res) => {
  const { wid, rowId } = req.params;
  const result = await updateCell(wid, rowId, 'final_status', 'submitted', actor(req));
  res.json({ success: true, ...result, data: result });
});

const lockRow = asyncHandler(async (req, res) => {
  const row = await TrackerRow.findOneAndUpdate(
    { _id: req.params.rowId, workspace: req.params.wid },
    { isLocked: true, status: 'locked', lockedBy: req.user._id, lockedAt: new Date() },
    { new: true }
  );
  await writeTrackerAudit({
    workspace: req.params.wid,
    user: req.user._id,
    action: 'row_locked',
    rowId: row?._id,
    description: 'Tracker row locked',
  });
  res.json({ success: true, row, data: row });
});

const unlockRow = asyncHandler(async (req, res) => {
  const row = await TrackerRow.findOneAndUpdate(
    { _id: req.params.rowId, workspace: req.params.wid },
    { isLocked: false, status: 'pending', lockedBy: null, lockedAt: null },
    { new: true }
  );
  await writeTrackerAudit({
    workspace: req.params.wid,
    user: req.user._id,
    action: 'row_unlocked',
    rowId: row?._id,
    description: 'Tracker row unlocked',
  });
  res.json({ success: true, row, data: row });
});

const importRows = asyncHandler(async (req, res) => {
  const importLog = await importWorkbook({ workspaceId: req.params.wid, file: req.file, user: req.user });
  res.status(201).json({ success: true, importLog, data: importLog });
});

const getImportById = asyncHandler(async (req, res) => {
  const importLog = await TrackerImport.findOne({ _id: req.params.importId, workspace: req.params.wid });
  if (!importLog) return res.status(404).json({ success: false, message: 'Import log not found' });
  res.json({ success: true, importLog, data: importLog });
});

const downloadTemplate = asyncHandler(async (req, res) => {
  const buffer = await writeTemplate(req.params.wid, req.user);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="daily-tracker-template.xlsx"');
  res.send(buffer);
});

const exportExcel = asyncHandler(async (req, res) => {
  const buffer = await writeWorkbook(req.params.wid, req.user, req.body?.filters || req.query || {});
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="daily-tracker-export.xlsx"');
  res.send(buffer);
});

const exportPdf = asyncHandler(async (req, res) => {
  const buffer = await writePdf(req.params.wid, req.user, req.body?.filters || req.query || {});
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="daily-tracker-summary.pdf"');
  res.send(buffer);
});

const bulkUpdateRows = asyncHandler(async (req, res) => {
  const { rowIds = [], updates = {} } = req.body;
  if (!Array.isArray(rowIds) || !rowIds.length) {
    return res.status(400).json({ success: false, message: 'rowIds array is required' });
  }

  const results = [];
  for (const rowId of rowIds) {
    const row = await TrackerRow.findOne({ _id: rowId, workspace: req.params.wid, isDeleted: { $ne: true } });
    if (!row) {
      results.push({ rowId, success: false, message: 'Row not found' });
      continue;
    }
    try {
      const result = await upsertRow(req.params.wid, row.config, rowId, updates, actor(req), { enforceRequired: false });
      results.push({ rowId, success: true, row: result.row });
    } catch (err) {
      results.push({ rowId, success: false, message: err.message });
    }
  }

  await writeTrackerAudit({
    workspace: req.params.wid,
    user: req.user._id,
    action: 'bulk_update',
    newValue: { rowIds, updates, results: results.map(({ rowId, success, message }) => ({ rowId, success, message })) },
    description: `Bulk updated ${results.filter((item) => item.success).length}/${rowIds.length} tracker rows`,
  });

  res.json({ success: true, results, data: results });
});

const bulkDeleteRows = asyncHandler(async (req, res) => {
  const { rowIds = [] } = req.body;
  if (!Array.isArray(rowIds) || !rowIds.length) {
    return res.status(400).json({ success: false, message: 'rowIds array is required' });
  }

  const result = await TrackerRow.updateMany(
    { _id: { $in: rowIds }, workspace: req.params.wid, isDeleted: { $ne: true } },
    { isDeleted: true, deletedAt: new Date(), deletedBy: req.user._id }
  );

  await writeTrackerAudit({
    workspace: req.params.wid,
    user: req.user._id,
    action: 'bulk_delete',
    newValue: { rowIds, modifiedCount: result.modifiedCount },
    description: `Bulk deleted ${result.modifiedCount} tracker rows`,
  });

  res.json({ success: true, result, data: result });
});

const summaryReport = asyncHandler(async (req, res) => {
  const summary = await getSummaryReport(req.params.wid, req.query);
  res.json({ success: true, summary, data: summary });
});

module.exports = {
  getConfig, createConfig, updateConfig,
  addConfigField, updateConfigField, deleteConfigField, reorderConfigFields,
  getRows, getRowById, createRow, updateRow, patchCell, deleteRow, submitRow, lockRow, unlockRow,
  importRows, getImportById, downloadTemplate, exportExcel, exportPdf, bulkUpdateRows, bulkDeleteRows, summaryReport
};
