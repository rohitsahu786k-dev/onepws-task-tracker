const mapToObject = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value.toObject === 'function') return value.toObject();
  return { ...value };
};

const normalizeRole = (user) => user?.workspaceRole || user?.role || user?.roleName;

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

const validateRowData = (configFields, rowData, existingRow = {}, options = {}) => {
  const { enforceRequired = true, validateOnlyKeys = null, isFinalSubmit = false } = options;
  const mergedData = { ...mapToObject(existingRow.rowData), ...rowData };
  const keysToValidate = validateOnlyKeys ? new Set(validateOnlyKeys) : null;

  for (const field of configFields) {
    if (field.isVisible === false || field.isDeleted || field.fieldType === 'auto') continue;
    if (keysToValidate && !keysToValidate.has(field.fieldKey)) continue;

    const val = typeof mergedData[field.fieldKey] === 'string'
      ? mergedData[field.fieldKey].trim()
      : mergedData[field.fieldKey];

    if (enforceRequired && field.isRequired && (val === undefined || val === null || val === '')) {
      throw new Error(`Field '${field.label}' is required.`);
    }

    validateFieldType(field, val);

    if (enforceRequired && field.fieldKey === 'remark_if_pending' && mergedData.final_status === 'pending' && !val && mergedData.actual_closing_date) {
      throw new Error('Remark If Pending is required when status is Pending.');
    }

    if (field.fieldKey === 'actual_closing_date' && mergedData.final_status === 'submitted' && !val) {
      throw new Error('Actual Closing Date is required when status is Submitted.');
    }

    if (enforceRequired && field.fieldKey === 'type_of_product' && String(mergedData.type_of_task || '').includes('cat') && !val) {
      throw new Error('Product Type is required for Catalogue tasks.');
    }
  }

  if ((isFinalSubmit || mergedData.final_status === 'submitted') && !mergedData.actual_closing_date) {
    throw new Error('Actual Closing Date is required before submitting the row.');
  }

  return true;
};

const checkRowLock = (row, user) => {
  if (!row) return;
  const role = normalizeRole(user);
  if (['admin', 'super_admin', 'owner'].includes(role)) return;

  const rowData = mapToObject(row.rowData);
  if (row.isLocked || rowData.final_status === 'submitted' || rowData.final_status === 'closed') {
    throw new Error('This row is submitted and locked. Only admin can edit.');
  }
};

const checkFieldPermission = (field, user) => {
  const role = normalizeRole(user);
  if (!role || ['admin', 'super_admin', 'owner'].includes(role)) return;

  const hiddenRoles = field.permissions?.hideFromRoles || [];
  if (hiddenRoles.includes(role)) throw new Error(`Field '${field.label}' is hidden for your role.`);

  const editRoles = field.permissions?.editRoles || [];
  if (editRoles.length && !editRoles.includes(role)) {
    throw new Error(`You do not have permission to edit '${field.label}'.`);
  }
};

module.exports = {
  validateRowData,
  checkRowLock,
  checkFieldPermission,
};
