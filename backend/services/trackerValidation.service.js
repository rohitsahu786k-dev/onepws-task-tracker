const mapToObject = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value.toObject === 'function') return value.toObject();
  return { ...value };
};

const validateFieldType = (field, value) => {
  if (value === undefined || value === null || value === '') return;

  if (['number', 'currency', 'percentage'].includes(field.fieldType) && Number.isNaN(Number(value))) {
    throw new Error(`Field '${field.label}' must be a number.`);
  }

  if (field.fieldType === 'date' && Number.isNaN(Date.parse(value))) {
    throw new Error(`Field '${field.label}' must be a valid date.`);
  }

  if (field.fieldType === 'checkbox' && typeof value !== 'boolean') {
    throw new Error(`Field '${field.label}' must be true or false.`);
  }

  if (field.fieldType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
    throw new Error(`Field '${field.label}' must be a valid email.`);
  }

  if (field.fieldType === 'url') {
    try {
      new URL(String(value));
    } catch {
      throw new Error(`Field '${field.label}' must be a valid URL.`);
    }
  }

  if (['dropdown', 'status'].includes(field.fieldType) && field.dropdownOptions?.length) {
    const allowed = field.dropdownOptions.filter((option) => option.isActive !== false).map((option) => option.value);
    if (!allowed.includes(value)) {
      throw new Error(`Field '${field.label}' has an invalid option.`);
    }
  }

  if (field.fieldType === 'multi_select' && field.dropdownOptions?.length) {
    if (!Array.isArray(value)) throw new Error(`Field '${field.label}' must be a list.`);
    const allowed = field.dropdownOptions.filter((option) => option.isActive !== false).map((option) => option.value);
    const invalid = value.find((item) => !allowed.includes(item));
    if (invalid) throw new Error(`Field '${field.label}' has an invalid option.`);
  }
};

const validateRowData = (configFields, rowData, existingRow = {}, isFinalSubmit = false) => {
  const mergedData = { ...mapToObject(existingRow.rowData), ...rowData };

  for (const field of configFields) {
    if (field.isVisible === false || field.isDeleted || field.fieldType === 'auto') continue;

    const val = typeof mergedData[field.fieldKey] === 'string'
      ? mergedData[field.fieldKey].trim()
      : mergedData[field.fieldKey];

    if (field.isRequired && (val === undefined || val === null || val === '')) {
      throw new Error(`Field '${field.label}' is required.`);
    }

    validateFieldType(field, val);

    if (field.fieldKey === 'remark_if_pending' && mergedData.final_status === 'pending' && !val) {
      throw new Error('Remark If Pending is required when status is Pending.');
    }

    if (field.fieldKey === 'actual_closing_date' && mergedData.final_status === 'submitted' && !val) {
      throw new Error('Actual Closing Date is required when status is Submitted.');
    }

    if (field.fieldKey === 'type_of_product' && String(mergedData.type_of_task || '').includes('cat') && !val) {
      throw new Error('Product Type is required for Catalogue tasks.');
    }
  }

  if (isFinalSubmit && !mergedData.actual_closing_date) {
    throw new Error('Actual Closing Date is required before submitting the row.');
  }

  return true;
};

const checkRowLock = (row, user) => {
  if (!row) return;
  if (user.role === 'admin' || user.role === 'super_admin') return;

  const rowData = mapToObject(row.rowData);
  if (row.isLocked || rowData.final_status === 'submitted') {
    throw new Error('This row is submitted and locked. Only admin can edit.');
  }
  if (rowData.final_status === 'closed') {
    throw new Error('This row is closed and cannot be edited.');
  }
};

module.exports = {
  validateRowData,
  checkRowLock,
};
