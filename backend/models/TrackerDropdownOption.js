const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', index: true },
  field: { type: mongoose.Schema.Types.ObjectId, ref: 'TrackerFieldConfig', required: true, index: true },
  label: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true },
  color: String,
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.models.TrackerDropdownOption || mongoose.model('TrackerDropdownOption', schema);
