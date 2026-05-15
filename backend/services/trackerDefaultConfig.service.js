const { randomUUID } = require('crypto');
const TrackerFieldConfig = require('../models/TrackerFieldConfig');

const option = (label, value, order) => ({ label, value, order, isActive: true });

const makeField = (field, index) => ({
  fieldId: field.fieldId || randomUUID(),
  order: index + 1,
  width: field.width || 180,
  isRequired: false,
  isEditable: true,
  isVisible: true,
  isSystem: false,
  permissions: {
    viewRoles: ['admin', 'manager', 'member', 'employee', 'owner'],
    editRoles: ['admin', 'manager', 'member', 'employee', 'owner'],
    hideFromRoles: [],
  },
  ...field,
});

const getDefaultTrackerFields = () => [
  makeField({
    label: 'S.No.',
    fieldKey: 'serial_no',
    fieldType: 'auto',
    isSystem: true,
    isEditable: false,
    width: 100,
    autoFormula: { formulaType: 'serial_number' },
  }, 0),
  makeField({
    label: 'Task Receipt Date',
    fieldKey: 'task_receipt_date',
    fieldType: 'date',
    isRequired: true,
    width: 170,
  }, 1),
  makeField({
    label: 'Task Number',
    fieldKey: 'task_number',
    fieldType: 'auto',
    isSystem: true,
    isEditable: false,
    width: 170,
    autoFormula: { formulaType: 'task_number' },
  }, 2),
  makeField({
    label: 'Revision Number',
    fieldKey: 'revision_number',
    fieldType: 'dropdown',
    defaultValue: 'R0',
    width: 140,
    dropdownOptions: ['R0', 'R1', 'R2', 'R3', 'R4', 'R5'].map((item, index) => option(item, item, index + 1)),
  }, 3),
  makeField({
    label: 'Task Provided By',
    fieldKey: 'task_provided_by',
    fieldType: 'dropdown',
    dropdownOptions: [
      option('Sales', 'sales', 1),
      option('Pre-Sales', 'pre_sales', 2),
      option('CR', 'cr', 3),
      option('CD', 'cd', 4),
      option('Admin', 'admin', 5),
      option('MOT', 'mot', 6),
      option('Others', 'others', 7),
    ],
  }, 4),
  makeField({
    label: 'Task Handled By',
    fieldKey: 'task_handled_by',
    fieldType: 'user',
  }, 5),
  makeField({
    label: 'Task Given By Department',
    fieldKey: 'task_given_by_department',
    fieldType: 'department',
  }, 6),
  makeField({
    label: 'Type Of Task',
    fieldKey: 'type_of_task',
    fieldType: 'dropdown',
    width: 240,
    dropdownOptions: [
      option('Catalogue upto 20 pages', 'cat_s', 1),
      option('Catalogue 20-40 pages', 'cat_m', 2),
      option('Catalogue 40+ pages', 'cat_l', 3),
      option('Brochure', 'brochure', 4),
      option('Flyer', 'flyer', 5),
      option('Social Media Post', 'social', 6),
      option('PPT <20 pages', 'ppt_s', 7),
      option('PPT >20 pages', 'ppt_l', 8),
      option('Website Update', 'web', 9),
      option('Events', 'events', 10),
      option('Email Campaign', 'email', 11),
      option('Other', 'other', 12),
    ],
  }, 7),
  makeField({
    label: 'Receipt Date From Final Inputs',
    fieldKey: 'receipt_date_from_final_inputs',
    fieldType: 'date',
    isRequired: true,
    width: 220,
  }, 8),
  makeField({
    label: 'My Target Due Date (+3 Days From Receipt Date)',
    fieldKey: 'my_target_due_date',
    fieldType: 'auto',
    isEditable: false,
    width: 240,
    autoFormula: {
      formulaType: 'date_plus_working_days',
      sourceField: 'receipt_date_from_final_inputs',
      daysToAdd: 3,
      excludeWeekends: true,
      excludeHolidays: true,
    },
  }, 9),
  makeField({
    label: 'Actual Closing Date',
    fieldKey: 'actual_closing_date',
    fieldType: 'date',
    width: 170,
  }, 10),
  makeField({
    label: 'Delay In Task Closure',
    fieldKey: 'delay_in_task_closure',
    fieldType: 'auto',
    isEditable: false,
    width: 170,
    autoFormula: {
      formulaType: 'date_difference',
      sourceField: 'actual_closing_date',
      targetField: 'my_target_due_date',
    },
  }, 11),
  makeField({
    label: 'Delay/In Time',
    fieldKey: 'delay_in_time',
    fieldType: 'auto',
    isEditable: false,
    width: 170,
    autoFormula: { formulaType: 'delay_status' },
  }, 12),
  makeField({
    label: 'Type Of Product CD/CCR/MOT/FLOOR',
    fieldKey: 'type_of_product',
    fieldType: 'dropdown',
    width: 230,
    dropdownOptions: [
      option('CD', 'cd', 1),
      option('CCR', 'ccr', 2),
      option('MOT', 'mot', 3),
      option('FLOOR', 'floor', 4),
      option('Other', 'other', 5),
    ],
  }, 13),
  makeField({
    label: 'Remark If Pending',
    fieldKey: 'remark_if_pending',
    fieldType: 'textarea',
    width: 260,
  }, 14),
  makeField({
    label: 'Final Status',
    fieldKey: 'final_status',
    fieldType: 'status',
    defaultValue: 'pending',
    width: 150,
    dropdownOptions: [
      option('Pending', 'pending', 1),
      option('Submitted', 'submitted', 2),
      option('Closed', 'closed', 3),
      option('Hold', 'hold', 4),
      option('Cancelled', 'cancelled', 5),
    ],
  }, 15),
];

const ensureDefaultTrackerConfig = async (workspaceId, userId) => {
  let config = await TrackerFieldConfig.findOne({ workspace: workspaceId, isDefault: true, isDeleted: { $ne: true } });
  if (config) return config;

  config = await TrackerFieldConfig.findOne({ workspace: workspaceId, isDeleted: { $ne: true } }).sort({ createdAt: 1 });
  if (config) return config;

  return TrackerFieldConfig.create({
    workspace: workspaceId,
    name: 'Marketing Daily Task Tracker',
    description: 'Default dynamic marketing tracker config',
    fields: getDefaultTrackerFields(),
    isDefault: true,
    isActive: true,
    createdBy: userId,
  });
};

module.exports = {
  ensureDefaultTrackerConfig,
  getDefaultTrackerFields,
};
