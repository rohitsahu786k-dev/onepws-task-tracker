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

  const fieldKey = generateFieldKey(fieldData.label);
  
  // Check duplicate
  const exists = config.fields.some(f => f.fieldKey === fieldKey);
  if (exists) throw new Error(`Field with key ${fieldKey} already exists`);

  const newField = {
    ...fieldData,
    fieldId: fieldData.fieldId || randomUUID(),
    fieldKey,
    order: fieldData.order || config.fields.length + 1
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
  
  Object.assign(field, updateData);
  config.updatedBy = user._id;
  await config.save();
  return config;
};

const hideField = async (configId, fieldId, user) => {
  const config = await TrackerFieldConfig.findById(configId);
  const field = config.fields.id(fieldId) || config.fields.find(f => f.fieldId === fieldId);
  if (field) {
    field.isVisible = false;
    field.isDeleted = true; // Soft hide/archive
    field.deletedAt = new Date();
    field.deletedBy = user._id;
    config.updatedBy = user._id;
    await config.save();
  }
  return config;
};

const reorderFields = async (configId, reorderData, user) => {
  // reorderData: [{ fieldKey: 'serial_no', order: 1 }, ...]
  const config = await TrackerFieldConfig.findById(configId);
  
  reorderData.forEach(({ fieldKey, order }) => {
    const field = config.fields.find(f => f.fieldKey === fieldKey);
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
