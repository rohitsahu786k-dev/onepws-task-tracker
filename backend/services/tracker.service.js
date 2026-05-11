const dayjs = require('dayjs');
const TrackerRow = require('../models/TrackerRow');
const TrackerFieldConfig = require('../models/TrackerFieldConfig');
const Task = require('../models/Task');
const { calculateWorkingDays, addWorkingDays } = require('../utils/calculateDelay');
const generateTaskNumber = require('../utils/generateTaskNumber');

/**
 * Perform all dynamic auto-calculations for a given row of data
 */
const calculateAutoFields = async (workspaceId, existingRow, inputData, configFields) => {
  const mergedData = { ...(existingRow?.rowData || {}), ...inputData };
  const calculatedData = { ...(existingRow?.calculatedData || {}) };

  // Loop through fields to find 'auto' types
  for (const field of configFields) {
    if (field.fieldType === 'auto' && field.autoFormula) {
      const { formulaType, sourceField, targetField, daysToAdd } = field.autoFormula;

      switch (formulaType) {
        case 'serial_number':
          if (!calculatedData[field.fieldKey]) {
            // Find highest serial number for this config
            const lastRow = await TrackerRow.findOne({ config: existingRow?.config || field._id })
              .sort({ 'calculatedData.serial_no': -1 })
              .limit(1);
            const nextNo = (lastRow?.calculatedData?.serial_no || 0) + 1;
            calculatedData[field.fieldKey] = nextNo;
          }
          break;

        case 'task_number':
          if (!calculatedData[field.fieldKey]) {
            calculatedData[field.fieldKey] = await generateTaskNumber(workspaceId);
          }
          break;

        case 'date_plus_working_days':
          if (mergedData[sourceField]) {
            const startDate = mergedData[sourceField];
            // add working days ignoring weekends/holidays
            const newDate = await addWorkingDays(startDate, daysToAdd || 0, workspaceId);
            calculatedData[field.fieldKey] = dayjs(newDate).format('YYYY-MM-DD');
          } else {
            calculatedData[field.fieldKey] = null;
          }
          break;

        case 'date_difference':
          if (mergedData[sourceField] && calculatedData[targetField]) {
            const end = dayjs(mergedData[sourceField]); // actual_closing_date
            const start = dayjs(calculatedData[targetField]); // my_target_due_date
            const diff = end.diff(start, 'day');
            calculatedData[field.fieldKey] = diff;
          } else {
            calculatedData[field.fieldKey] = null;
          }
          break;

        case 'delay_status':
          // We assume "delay_in_task_closure" is calculated before this, or we look for it
          const delayFieldKey = 'delay_in_task_closure';
          const delayVal = calculatedData[delayFieldKey];
          if (delayVal !== undefined && delayVal !== null) {
            if (delayVal > 0) {
              calculatedData[field.fieldKey] = `Delayed by ${delayVal} days`;
            } else {
              calculatedData[field.fieldKey] = 'On Time';
            }
          } else {
            calculatedData[field.fieldKey] = 'Pending';
          }
          break;

        case 'custom':
          // Future: evaluate safe custom expressions
          break;
      }
    }
  }

  return calculatedData;
};

/**
 * Upsert a row in the tracker
 */
const saveTrackerRow = async (workspaceId, configId, rowId, rowData, user) => {
  const config = await TrackerFieldConfig.findById(configId);
  if (!config) throw new Error('Tracker Config not found');

  let row;
  if (rowId) {
    row = await TrackerRow.findById(rowId);
    if (!row) throw new Error('Row not found');
  }

  const calculatedData = await calculateAutoFields(workspaceId, row, rowData, config.fields);

  // If new row, determine rowNumber
  let rowNumber = row?.rowNumber;
  if (!rowNumber) {
    const lastRow = await TrackerRow.findOne({ config: configId }).sort({ rowNumber: -1 });
    rowNumber = (lastRow?.rowNumber || 0) + 1;
  }

  const updatePayload = {
    workspace: workspaceId,
    config: configId,
    rowNumber,
    rowData: { ...(row?.rowData || {}), ...rowData },
    calculatedData,
    updatedBy: user._id,
  };

  if (!rowId) {
    updatePayload.createdBy = user._id;
    row = await TrackerRow.create(updatePayload);
  } else {
    row = await TrackerRow.findByIdAndUpdate(rowId, updatePayload, { new: true });
  }

  // Create Task object implicitly if needed (mirroring data)
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
      createdBy: user._id,
    });
    row.task = newTask._id;
    await row.save();
  }

  return row;
};

module.exports = {
  calculateAutoFields,
  saveTrackerRow,
};
