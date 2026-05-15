const TrackerRow = require('../models/TrackerRow');
const TrackerFieldConfig = require('../models/TrackerFieldConfig');
const Task = require('../models/Task');
const { runAutoFormulas } = require('./trackerCalculation.service');
const { validateRowData, checkRowLock, checkFieldPermission } = require('./trackerValidation.service');
const { syncTaskEvent, syncTrackerEvent } = require('./calendar.service');
const { notify } = require('./notification.service');
const { writeTrackerAudit } = require('./trackerAudit.service');

const mapToObject = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value.toObject === 'function') return value.toObject();
  return { ...value };
};

const applyDefaults = (fields, rowData) => {
  const data = { ...rowData };
  fields.forEach((field) => {
    if (
      field.fieldType !== 'auto'
      && field.defaultValue !== undefined
      && field.defaultValue !== null
      && (data[field.fieldKey] === undefined || data[field.fieldKey] === null || data[field.fieldKey] === '')
    ) {
      data[field.fieldKey] = field.defaultValue;
    }
  });

  if (!data.final_status) data.final_status = 'pending';
  return data;
};

const hasMeaningfulInput = (rowData = {}) => Object.entries(rowData).some(([key, value]) => {
  if (key === 'final_status') return false;
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== '';
});

const normalizeProductType = (value) => {
  const options = { cd: 'CD', ccr: 'CCR', mot: 'MOT', floor: 'FLOOR', other: 'Other' };
  return options[String(value || '').toLowerCase()];
};

/**
 * Sync row with main Task Collection
 */
const syncTaskFromRow = async (row, calculatedData, workspaceId, user) => {
  const rowData = mapToObject(row.rowData);
  let taskDoc = null;
  if (!hasMeaningfulInput(rowData)) return null;

  if (!row.task && calculatedData.task_number) {
    const newTask = await Task.create({
      workspace: workspaceId,
      taskNumber: calculatedData.task_number,
      title: rowData.type_of_task || `Task ${calculatedData.task_number}`,
      description: rowData.remark_if_pending || '',
      status: rowData.final_status === 'submitted' ? 'closed' : 'open',
      receiptDate: rowData.task_receipt_date,
      finalInputReceiptDate: rowData.receipt_date_from_final_inputs,
      dueDate: calculatedData.my_target_due_date,
      targetDueDate: calculatedData.my_target_due_date,
      actualClosingDate: rowData.actual_closing_date,
      delayInDays: calculatedData.delay_in_task_closure,
      delayStatus: calculatedData.delay_in_task_closure > 0 ? 'delayed' : calculatedData.delay_in_task_closure < 0 ? 'early' : rowData.actual_closing_date ? 'on_time' : 'pending',
      assignedTo: rowData.task_handled_by ? [rowData.task_handled_by] : [],
      handledBy: rowData.task_handled_by,
      requestedByDepartment: rowData.task_given_by_department,
      productType: normalizeProductType(rowData.type_of_product),
      remarkIfPending: rowData.remark_if_pending,
      finalStatus: rowData.final_status,
      createdBy: user._id,
    });
    row.task = newTask._id;
    await row.save();
    taskDoc = newTask;
  } else if (row.task) {
    taskDoc = await Task.findByIdAndUpdate(row.task, {
      title: rowData.type_of_task || `Task ${calculatedData.task_number}`,
      status: rowData.final_status === 'submitted' ? 'closed' : 'open',
      description: rowData.remark_if_pending,
      assignedTo: rowData.task_handled_by ? [rowData.task_handled_by] : [],
      handledBy: rowData.task_handled_by,
      dueDate: calculatedData.my_target_due_date,
      targetDueDate: calculatedData.my_target_due_date,
      actualClosingDate: rowData.actual_closing_date,
      delayInDays: calculatedData.delay_in_task_closure,
      delayStatus: calculatedData.delay_in_task_closure > 0 ? 'delayed' : calculatedData.delay_in_task_closure < 0 ? 'early' : rowData.actual_closing_date ? 'on_time' : 'pending',
      productType: normalizeProductType(rowData.type_of_product),
      finalStatus: rowData.final_status,
      remarkIfPending: rowData.remark_if_pending,
    }, { new: true });
  }
  return taskDoc;
};

/**
 * Upsert Tracker Row
 */
const upsertRow = async (workspaceId, configId, rowId, rowData, user, options = {}) => {
  const config = await TrackerFieldConfig.findOne({ _id: configId, workspace: workspaceId });
  if (!config) throw new Error('Tracker Config not found');

  let row = null;
  if (rowId) {
    row = await TrackerRow.findOne({ _id: rowId, workspace: workspaceId, isDeleted: { $ne: true } });
    if (!row) throw new Error('Row not found');
    checkRowLock(row, user);
  }

  let rowNumber = row?.rowNumber;
  if (!rowNumber) {
    const lastRow = await TrackerRow.findOne({ workspace: workspaceId, config: configId }).sort({ rowNumber: -1 });
    rowNumber = (lastRow?.rowNumber || 0) + 1;
  }

  const meaningfulInput = hasMeaningfulInput(rowData);
  const incomingData = applyDefaults(config.fields, rowData);
  validateRowData(config.fields, incomingData, row || {}, {
    enforceRequired: options.enforceRequired ?? (meaningfulInput || incomingData.final_status === 'submitted'),
    isFinalSubmit: incomingData.final_status === 'submitted',
  });

  const calculatedData = await runAutoFormulas(workspaceId, row, incomingData, config.fields, rowNumber);
  const mergedRowData = { ...mapToObject(row?.rowData), ...incomingData };
  const isSubmitted = mergedRowData.final_status === 'submitted';
  const isClosed = mergedRowData.final_status === 'closed';
  const isDraft = !hasMeaningfulInput(mergedRowData);

  const updatePayload = {
    workspace: workspaceId,
    config: configId,
    rowNumber,
    rowData: mergedRowData,
    calculatedData,
    status: isDraft ? 'draft' : isSubmitted ? 'submitted' : isClosed ? 'locked' : 'pending',
    isLocked: isSubmitted || isClosed,
    updatedBy: user._id,
  };

  if (isSubmitted && !row?.submittedAt) {
    updatePayload.submittedAt = new Date();
    updatePayload.submittedBy = user._id;
    updatePayload.lockedAt = new Date();
    updatePayload.lockedBy = user._id;
  }

  if (!rowId) {
    updatePayload.createdBy = user._id;
    row = await TrackerRow.create(updatePayload);
    await writeTrackerAudit({
      workspace: workspaceId,
      user: user._id,
      action: 'row_created',
      rowId: row._id,
      newValue: { rowNumber, rowData: mergedRowData, calculatedData },
      description: `Tracker row #${rowNumber} created`,
    });
  } else {
    const oldRowData = mapToObject(row.rowData);
    row = await TrackerRow.findByIdAndUpdate(rowId, updatePayload, { new: true });
    await writeTrackerAudit({
      workspace: workspaceId,
      user: user._id,
      action: isSubmitted ? 'row_submitted' : 'row_updated',
      rowId: row._id,
      oldValue: oldRowData,
      newValue: mergedRowData,
      description: `Tracker row #${rowNumber} updated`,
    });
  }

  // Sync with Calendar/Tasks
  if (!isDraft) {
    const taskDoc = await syncTaskFromRow(row, calculatedData, workspaceId, user);
    if (row.task) {
      const task = taskDoc || await Task.findById(row.task);
      await syncTaskEvent(task);
    }
    await syncTrackerEvent(row);

    if (!rowId && mergedRowData.task_handled_by) {
      await notify({
        workspace: workspaceId,
        sender: user._id,
        recipients: [mergedRowData.task_handled_by],
        type: 'tracker_task_assigned',
        title: `New Marketing Tracker Task Assigned: ${calculatedData.task_number || `#${rowNumber}`}`,
        message: `${calculatedData.task_number || `Tracker row #${rowNumber}`} has been assigned to you.`,
        refModel: 'TrackerRow',
        refId: row._id,
        actionUrl: '/tracker',
        channels: { inApp: true },
        metadata: { taskNumber: calculatedData.task_number, rowNumber },
      });
    }
  }

  return { row, recalculatedFields: calculatedData };
};

/**
 * Update Single Cell
 */
const updateCell = async (workspaceId, rowId, fieldKey, value, user) => {
  const row = await TrackerRow.findOne({ _id: rowId, workspace: workspaceId, isDeleted: { $ne: true } });
  if (!row) throw new Error('Row not found');
  checkRowLock(row, user);

  const config = await TrackerFieldConfig.findById(row.config);
  
  const fieldConfig = config.fields.find(f => f.fieldKey === fieldKey);
  if (!fieldConfig) throw new Error('Field does not exist');
  if (fieldConfig.fieldType === 'auto') throw new Error('Cannot manually edit an auto-calculated field');
  if (fieldConfig.isEditable === false) throw new Error('This field is read-only');
  checkFieldPermission(fieldConfig, user);

  const newRowData = { [fieldKey]: value };
  validateRowData(config.fields, newRowData, row, {
    enforceRequired: false,
    validateOnlyKeys: [fieldKey],
  });
  const oldRowData = mapToObject(row.rowData);
  const oldValue = oldRowData[fieldKey];
  
  const result = await upsertRow(workspaceId, config._id, rowId, newRowData, user, {
    enforceRequired: value === 'submitted' && fieldKey === 'final_status',
  });
  await writeTrackerAudit({
    workspace: workspaceId,
    user: user._id,
    action: 'cell_updated',
    rowId,
    fieldKey,
    oldValue,
    newValue: value,
    description: `Tracker cell '${fieldKey}' updated`,
  });

  return result;
};

module.exports = {
  upsertRow,
  updateCell
};
