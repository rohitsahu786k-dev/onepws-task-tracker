const dayjs = require('dayjs');
const { calculateWorkingDays, addWorkingDays } = require('../utils/calculateDelay');
const generateTaskNumber = require('../utils/generateTaskNumber');

const mapToObject = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value.toObject === 'function') return value.toObject();
  return { ...value };
};

const signedWorkingDayDiff = async (targetDate, actualDate, workspaceId) => {
  const target = dayjs(targetDate);
  const actual = dayjs(actualDate);
  if (!target.isValid() || !actual.isValid() || target.isSame(actual, 'day')) return 0;

  if (actual.isAfter(target, 'day')) {
    return calculateWorkingDays(target.add(1, 'day').toDate(), actual.toDate(), workspaceId);
  }

  const earlyDays = await calculateWorkingDays(actual.add(1, 'day').toDate(), target.toDate(), workspaceId);
  return -earlyDays;
};

/**
 * Run auto calculations based on field formulas
 */
const runAutoFormulas = async (workspaceId, existingRow, inputData, configFields, rowNumber) => {
  const mergedData = { ...mapToObject(existingRow?.rowData), ...inputData };
  const calculatedData = { ...mapToObject(existingRow?.calculatedData) };

  const fields = [...configFields].sort((a, b) => (a.order || 0) - (b.order || 0));
  for (const field of fields) {
    if (field.fieldType === 'auto' && field.autoFormula) {
      const { formulaType, sourceField, targetField, daysToAdd } = field.autoFormula;

      switch (formulaType) {
        case 'serial_number':
          if (!calculatedData[field.fieldKey]) {
            calculatedData[field.fieldKey] = rowNumber;
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
            const newDate = await addWorkingDays(startDate, daysToAdd || 0, workspaceId);
            calculatedData[field.fieldKey] = dayjs(newDate).format('YYYY-MM-DD');
          } else {
            calculatedData[field.fieldKey] = null;
          }
          break;

        case 'date_difference':
          if (mergedData[sourceField] && (calculatedData[targetField] || mergedData[targetField])) {
            calculatedData[field.fieldKey] = await signedWorkingDayDiff(
              calculatedData[targetField] || mergedData[targetField],
              mergedData[sourceField],
              workspaceId
            );
          } else {
            calculatedData[field.fieldKey] = null;
          }
          break;

        case 'delay_status':
          if (!mergedData.actual_closing_date) {
            calculatedData[field.fieldKey] = 'Pending';
            break;
          }

          const delayVal = calculatedData.delay_in_task_closure;
          if (delayVal > 0) {
            calculatedData[field.fieldKey] = `Delayed by ${delayVal} day(s)`;
          } else if (delayVal === 0) {
            calculatedData[field.fieldKey] = 'On Time';
          } else if (delayVal < 0) {
            calculatedData[field.fieldKey] = `Early by ${Math.abs(delayVal)} day(s)`;
          } else {
            calculatedData[field.fieldKey] = 'Pending';
          }
          break;
      }
    }
  }

  return calculatedData;
};

module.exports = {
  runAutoFormulas
};
