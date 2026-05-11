const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  originalName: String, storedName: String, filePath: String, fileUrl: String,
  mimeType: String, extension: String, size: Number,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.TaskAttachment || mongoose.model('TaskAttachment', schema);
