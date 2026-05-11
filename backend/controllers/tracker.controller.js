const asyncHandler = require('../utils/asyncHandler');
const TrackerFieldConfig = require('../models/TrackerFieldConfig');
const TrackerRow = require('../models/TrackerRow');
const { upsertRow, updateCell } = require('../services/trackerRow.service');
const { addField, updateField, hideField, reorderFields } = require('../services/trackerConfig.service');

// ── CONFIG ──────────────────────────────────────────────────────────────────

const getConfig = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  let config = await TrackerFieldConfig.findOne({ workspace: wid, isDefault: true });
  if (!config) config = await TrackerFieldConfig.findOne({ workspace: wid });
  if (!config) return res.status(404).json({ success: false, message: 'Config not found' });
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
  if (Array.isArray(req.body.fields)) config.fields = req.body.fields;
  config.updatedBy = req.user._id;
  await config.save();

  res.json({ success: true, config, data: config });
});

// ── FIELDS ──────────────────────────────────────────────────────────────────

const addConfigField = asyncHandler(async (req, res) => {
  const config = await addField(req.body.configId, req.body.fieldData, req.user);
  res.json({ success: true, config, data: config });
});

const updateConfigField = asyncHandler(async (req, res) => {
  const config = await updateField(req.body.configId, req.params.fieldId, req.body.updateData, req.user);
  res.json({ success: true, config, data: config });
});

const deleteConfigField = asyncHandler(async (req, res) => {
  const config = await hideField(req.body.configId, req.params.fieldId, req.user);
  res.json({ success: true, config, data: config });
});

const reorderConfigFields = asyncHandler(async (req, res) => {
  const config = await reorderFields(req.body.configId, req.body.reorderData, req.user);
  res.json({ success: true, config, data: config });
});

// ── ROWS ────────────────────────────────────────────────────────────────────

const getRows = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  let configId = req.query.configId;
  if (!configId) {
    const config = await TrackerFieldConfig.findOne({ workspace: wid, isDefault: true }) || await TrackerFieldConfig.findOne({ workspace: wid });
    configId = config?._id;
  }
  const query = { config: configId, workspace: wid, isDeleted: { $ne: true } };
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
    const config = await TrackerFieldConfig.findOne({ workspace: wid, isDefault: true }) || await TrackerFieldConfig.findOne({ workspace: wid });
    configId = config?._id;
  }
  const result = await upsertRow(wid, configId, null, rowData, req.user);
  res.status(201).json({ success: true, ...result, data: result });
});

const updateRow = asyncHandler(async (req, res) => {
  const { wid, rowId } = req.params;
  let { configId, rowData } = req.body;
  if (!configId) {
    const row = await TrackerRow.findOne({ _id: rowId, workspace: wid });
    configId = row?.config;
  }
  const result = await upsertRow(wid, configId, rowId, rowData, req.user);
  res.json({ success: true, ...result, data: result });
});

const patchCell = asyncHandler(async (req, res) => {
  const { wid, rowId } = req.params;
  const { fieldKey, value } = req.body;
  const result = await updateCell(wid, rowId, fieldKey, value, req.user);
  res.json({ success: true, message: "Cell updated successfully", data: result });
});

const deleteRow = asyncHandler(async (req, res) => {
  const { rowId } = req.params;
  // Soft delete logic
  await TrackerRow.findOneAndUpdate({ _id: rowId, workspace: req.params.wid }, { isDeleted: true, deletedAt: new Date(), deletedBy: req.user._id });
  res.json({ success: true, message: 'Row deleted successfully' });
});

const submitRow = asyncHandler(async (req, res) => {
  const { wid, rowId } = req.params;
  const result = await updateCell(wid, rowId, 'final_status', 'submitted', req.user);
  res.json({ success: true, ...result, data: result });
});

const lockRow = asyncHandler(async (req, res) => {
  const row = await TrackerRow.findOneAndUpdate(
    { _id: req.params.rowId, workspace: req.params.wid },
    { isLocked: true, status: 'locked', lockedBy: req.user._id, lockedAt: new Date() },
    { new: true }
  );
  res.json({ success: true, row, data: row });
});

const unlockRow = asyncHandler(async (req, res) => {
  const row = await TrackerRow.findOneAndUpdate(
    { _id: req.params.rowId, workspace: req.params.wid },
    { isLocked: false, status: 'pending', lockedBy: null, lockedAt: null },
    { new: true }
  );
  res.json({ success: true, row, data: row });
});

module.exports = {
  getConfig, createConfig, updateConfig,
  addConfigField, updateConfigField, deleteConfigField, reorderConfigFields,
  getRows, getRowById, createRow, updateRow, patchCell, deleteRow, submitRow, lockRow, unlockRow
};
