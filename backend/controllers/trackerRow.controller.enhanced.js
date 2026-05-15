/**
 * trackerRow.controller.enhanced.js - Complete Tracker Row Logic
 * Handles: Create, Update, Delete tracker rows with auto-calculations
 */

const asyncHandler = require('../utils/asyncHandler');
const TrackerRow = require('../models/TrackerRow');
const TrackerFieldConfig = require('../models/TrackerFieldConfig');
const ActivityLog = require('../models/ActivityLog');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const trackerService = require('../services/tracker.service');
const calendarService = require('../services/calendar.service');
const workingDaysService = require('../services/workingDays.service');

/**
 * CREATE NEW TRACKER ROW
 * POST /api/workspaces/:wid/tracker/rows
 * 
 * Body: {
 *   configId: "config_id",
 *   rowData: { field1: value1, field2: value2, ... }
 * }
 */
const createTrackerRow = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  const { configId, rowData } = req.body;

  // 1. VALIDATE config exists
  const config = await TrackerFieldConfig.findById(configId);
  if (!config || config.workspace.toString() !== wid) {
    throw new ApiError(404, 'Tracker config not found');
  }

  // 2. GENERATE row number
  const lastRow = await TrackerRow.findOne({ workspace: wid, configId })
    .sort({ rowNumber: -1 })
    .select('rowNumber');
  
  const rowNumber = (lastRow?.rowNumber || 0) + 1;

  // 3. PROCESS and CALCULATE auto-fields
  const processedData = await trackerService.calculateAutoFields(
    rowData,
    config.fields,
    wid
  );
  // This service:
  // - Generates task number: MKT-2026-{rowNumber}
  // - Calculates target due dates (receipt_date + working days)
  // - Computes delays (actualClosing - targetDue)
  // - Sets delayStatus: "On Time" / "Delayed (X days)" / "Early (X days)"

  // 4. CREATE row document
  const row = await TrackerRow.create({
    workspace: wid,
    configId,
    rowNumber,
    rowData: processedData.rowData,
    calculatedData: processedData.calculatedData,
    createdBy: req.user._id
  });

  // 5. CREATE CALENDAR EVENT if dueDate exists
  if (processedData.rowData.target_due_date || processedData.rowData.actual_closing_date) {
    try {
      const dueDate = new Date(
        processedData.rowData.target_due_date || processedData.rowData.actual_closing_date
      );
      
      await calendarService.createFromTrackerRow(row, req.user._id, wid);
    } catch (err) {
      console.warn('Failed to create calendar event:', err);
    }
  }

  // 6. ACTIVITY LOG
  await ActivityLog.create({
    workspace: wid,
    user: req.user._id,
    action: 'tracker_row_created',
    refId: row._id,
    refModel: 'TrackerRow',
    meta: { rowNumber }
  });

  // 7. POPULATE and return
  const populatedRow = await TrackerRow.findById(row._id)
    .populate('createdBy', 'name email')
    .lean();

  return res.status(201).json(
    new ApiResponse(201, populatedRow, 'Row added successfully')
  );
});

/**
 * UPDATE TRACKER ROW FIELD (inline editing)
 * PATCH /api/workspaces/:wid/tracker/rows/:rowId/field
 * 
 * Body: {
 *   fieldKey: "actual_closing_date",
 *   value: "2026-05-15"
 * }
 */
const updateTrackerRowField = asyncHandler(async (req, res) => {
  const { wid, rowId } = req.params;
  const { fieldKey, value } = req.body;

  if (!fieldKey) {
    throw new ApiError(400, 'Field key required');
  }

  // 1. FETCH row
  const row = await TrackerRow.findById(rowId);
  if (!row || row.workspace.toString() !== wid) {
    throw new ApiError(404, 'Row not found');
  }

  // 2. FETCH config for field definitions
  const config = await TrackerFieldConfig.findById(row.configId);

  // 3. UPDATE the field
  row.rowData[fieldKey] = value;

  // 4. RECALCULATE dependent fields
  const processed = await trackerService.calculateAutoFields(
    row.rowData,
    config.fields,
    wid
  );
  
  row.rowData = processed.rowData;
  row.calculatedData = processed.calculatedData;
  row.updatedBy = req.user._id;
  row.updatedAt = new Date();

  // 5. SAVE
  await row.save();

  // 6. Activity log
  await ActivityLog.create({
    workspace: wid,
    user: req.user._id,
    action: 'tracker_field_updated',
    refId: row._id,
    refModel: 'TrackerRow',
    meta: { fieldKey, oldValue: row.rowData[fieldKey], newValue: value }
  });

  // 7. Socket emit (real-time update)
  // io.to(`workspace:${wid}`).emit('tracker_row_updated', row);

  const populatedRow = await TrackerRow.findById(row._id).lean();
  return res.json(
    new ApiResponse(200, populatedRow, 'Field updated successfully')
  );
});

/**
 * GET TRACKER ROWS (with filters and pagination)
 * GET /api/workspaces/:wid/tracker/rows?configId=&search=&page=1&limit=50
 */
const getTrackerRows = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  const { configId, search, page = 1, limit = 50, sort = '-createdAt' } = req.query;

  const filter = { workspace: wid };
  if (configId) filter.configId = configId;

  if (search) {
    filter.$or = [
      { 'rowData.task_number': { $regex: search, $options: 'i' } },
      { 'rowData.task_provided_by': { $regex: search, $options: 'i' } }
    ];
  }

  const total = await TrackerRow.countDocuments(filter);

  const rows = await TrackerRow.find(filter)
    .populate('createdBy', 'name email')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  return res.json(
    new ApiResponse(200, {
      rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    })
  );
});

/**
 * DELETE TRACKER ROW
 * DELETE /api/workspaces/:wid/tracker/rows/:rowId
 */
const deleteTrackerRow = asyncHandler(async (req, res) => {
  const { wid, rowId } = req.params;

  const row = await TrackerRow.findByIdAndDelete(rowId);
  if (!row) {
    throw new ApiError(404, 'Row not found');
  }

  await ActivityLog.create({
    workspace: wid,
    user: req.user._id,
    action: 'tracker_row_deleted',
    meta: { rowNumber: row.rowNumber }
  });

  return res.json(new ApiResponse(200, null, 'Row deleted successfully'));
});

/**
 * BULK UPDATE TRACKER ROWS
 * POST /api/workspaces/:wid/tracker/rows/bulk-update
 * 
 * Body: {
 *   rowIds: [...],
 *   updates: { fieldKey: value, ... }
 * }
 */
const bulkUpdateTrackerRows = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  const { rowIds, updates } = req.body;

  if (!Array.isArray(rowIds) || !updates) {
    throw new ApiError(400, 'Invalid request data');
  }

  const result = await TrackerRow.updateMany(
    { _id: { $in: rowIds }, workspace: wid },
    {
      $set: {
        ...Object.entries(updates).reduce((acc, [key, value]) => {
          acc[`rowData.${key}`] = value;
          return acc;
        }, {}),
        updatedBy: req.user._id,
        updatedAt: new Date()
      }
    }
  );

  return res.json(
    new ApiResponse(200, result, `Updated ${result.modifiedCount} rows`)
  );
});

module.exports = {
  createTrackerRow,
  updateTrackerRowField,
  getTrackerRows,
  deleteTrackerRow,
  bulkUpdateTrackerRows
};
