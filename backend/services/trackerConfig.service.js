const { randomUUID } = require('crypto');
const TrackerFieldConfig = require('../models/TrackerFieldConfig');

const generateFieldKey = (label) => {
  return String(label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
};

const addField = async (configId, fieldData, user) => {
  const config = await TrackerFieldConfig.findById(configId);
  if (!config) throw new Error('Tracker Config not found');

  if (!fieldData?.label) throw new Error('Field label is required');
  if (!fieldData?.fieldType) throw new Error('Field type is required');

  const fieldKey = fieldData.fieldKey || generateFieldKey(fieldData.label);
  if (!fieldKey) throw new Error('Field key could not be generated');
  
  // Check duplicate
  const exists = config.fields.some(f => f.fieldKey === fieldKey && !f.isDeleted);
  if (exists) throw new Error(`Field with key ${fieldKey} already exists`);

  const newField = {
    ...fieldData,
    fieldId: fieldData.fieldId || randomUUID(),
    fieldKey,
    isVisible: fieldData.isVisible ?? true,
    isEditable: fieldData.fieldType === 'auto' ? false : fieldData.isEditable ?? true,
    isRequired: fieldData.isRequired ?? false,
    isSystem: fieldData.isSystem ?? false,
    order: fieldData.order || Math.max(0, ...config.fields.map((field) => field.order || 0)) + 1
  };

  config.fields.push(newField);
  config.updatedBy = user._id;
  await config.save();
  return config;
};

const updateField = async (configId, fieldId, updateData, user) => {
  const config = await TrackerFieldConfig.findById(configId);
  if (!config) throw new Error('Tracker Config not found');

  const field = config.fields.id(fieldId) || config.fields.find(f => f.fieldId === fieldId);
  if (!field) throw new Error('Field not found');

  // Prevent changing fieldKey directly here to protect row data
  delete updateData.fieldKey;
  delete updateData.fieldId;
  delete updateData._id;
  delete updateData.isSystem;
  
  Object.assign(field, updateData);
  config.updatedBy = user._id;
  await config.save();
  return config;
};

const hideField = async (configId, fieldId, user) => {
  const config = await TrackerFieldConfig.findById(configId);
  if (!config) throw new Error('Tracker Config not found');
  const field = config.fields.id(fieldId) || config.fields.find(f => f.fieldId === fieldId);
  if (!field) throw new Error('Field not found');
  if (field.isSystem) throw new Error('System fields cannot be deleted');

  field.isVisible = false;
  field.isDeleted = true; // Soft hide/archive
  field.deletedAt = new Date();
  field.deletedBy = user._id;
  config.updatedBy = user._id;
  await config.save();
  return config;
};

const reorderFields = async (configId, reorderData, user) => {
  // reorderData: [{ fieldKey: 'serial_no', order: 1 }, ...]
  const config = await TrackerFieldConfig.findById(configId);
  if (!config) throw new Error('Tracker Config not found');
  if (!Array.isArray(reorderData)) throw new Error('Reorder data must be an array');
  
  reorderData.forEach(({ fieldKey, fieldId, order }) => {
    const field = fieldId
      ? (config.fields.id(fieldId) || config.fields.find(f => f.fieldId === fieldId))
      : config.fields.find(f => f.fieldKey === fieldKey);
    if (field) field.order = order;
  });

  // Sort fields by new order
  config.fields.sort((a, b) => a.order - b.order);
  
  config.updatedBy = user._id;
  await config.save();
  return config;
};

module.exports = {
  addField,
  updateField,
  hideField,
  reorderFields
};
