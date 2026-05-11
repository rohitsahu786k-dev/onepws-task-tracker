const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  config: { type: mongoose.Schema.Types.ObjectId, ref: "TrackerFieldConfig" },
  originalFileName: String, filePath: String,
  totalRows: Number, successRows: Number, failedRows: Number,
  errors: [{ rowNumber: Number, fieldKey: String, message: String }],
  status: { type: String, enum: ["processing", "completed", "failed"], default: "processing" },
  importedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.TrackerImport || mongoose.model('TrackerImport', schema);
