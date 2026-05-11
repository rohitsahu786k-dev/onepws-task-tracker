const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  name: { type: String, default: "Marketing Daily Task Tracker" },
  description: String,
  fields: [{
    fieldId: String, label: { type: String, required: true }, fieldKey: { type: String, required: true },
    fieldType: { type: String, enum: ["text", "number", "date", "dropdown", "multi_select", "checkbox", "textarea", "user", "department", "file", "auto", "status", "currency", "percentage", "url", "email", "phone"], required: true },
    isRequired: { type: Boolean, default: false }, isEditable: { type: Boolean, default: true },
    isVisible: { type: Boolean, default: true }, isSystem: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }, deletedAt: Date, deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isLockedAfterSubmit: { type: Boolean, default: false },
    order: Number, width: Number, placeholder: String, helpText: String, defaultValue: mongoose.Schema.Types.Mixed,
    dropdownOptions: [{ label: String, value: String, color: String, order: Number, isActive: Boolean }],
    validation: { min: Number, max: Number, regex: String, minLength: Number, maxLength: Number },
    permissions: {
      viewRoles: [String],
      editRoles: [String],
      hideFromRoles: [String]
    },
    lockRule: {
      lockAfterSubmit: Boolean,
      lockForRoles: [String]
    },
    autoFormula: {
      formulaType: { type: String, enum: ["serial_number", "task_number", "date_plus_working_days", "date_difference", "delay_status", "copy_from_field", "concat_fields", "custom_expression", "custom"] },
      sourceField: String, targetField: String, daysToAdd: Number, excludeWeekends: Boolean, excludeHolidays: Boolean, customExpression: String
    }
  }],
  isDefault: Boolean, isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.TrackerFieldConfig || mongoose.model('TrackerFieldConfig', schema);
