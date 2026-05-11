const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  backupType: { type: String, enum: ["manual", "scheduled"] },
  filePath: String, fileUrl: String, dbDumpPath: String, uploadsZipPath: String,
  size: Number,
  status: { type: String, enum: ["processing", "completed", "failed"], default: "processing" },
  errorMessage: String, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: false });

module.exports = mongoose.models.Backup || mongoose.model('Backup', schema);
