const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  printJob: { type: mongoose.Schema.Types.ObjectId, ref: 'PrintJob' },
  action: { type: String },
  message: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: { createdAt: true, updatedAt: false } });

schema.index({ workspace: 1, printJob: 1, createdAt: -1 });

module.exports = mongoose.models.PrintJobActivity || mongoose.model('PrintJobActivity', schema);
