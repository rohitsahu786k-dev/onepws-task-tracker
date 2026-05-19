const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  name: { type: String, required: true },
  printJobType: String,
  description: String,
  defaultSpecifications: Object,
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

schema.index({ workspace: 1, isActive: 1 });

module.exports = mongoose.models.PrintJobTemplate || mongoose.model('PrintJobTemplate', schema);
