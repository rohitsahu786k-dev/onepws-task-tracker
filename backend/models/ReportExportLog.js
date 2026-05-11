const mongoose = require('mongoose');

const reportExportLogSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  report: { type: mongoose.Schema.Types.ObjectId, ref: "Report" },
  reportType: String,
  exportFormat: {
    type: String,
    enum: ["pdf", "excel", "csv"]
  },
  filePath: String,
  fileUrl: String,
  fileSize: Number,
  status: {
    type: String,
    enum: ["success", "failed"],
    default: "success"
  },
  errorMessage: String,
  exportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});

reportExportLogSchema.index({ workspace: 1, exportedBy: 1 });
reportExportLogSchema.index({ workspace: 1, reportType: 1 });
reportExportLogSchema.index({ workspace: 1, createdAt: -1 });

module.exports = mongoose.model('ReportExportLog', reportExportLogSchema);
