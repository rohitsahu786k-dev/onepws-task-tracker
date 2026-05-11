const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  comment: String,
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  attachments: [{ fileName: String, filePath: String, fileUrl: String, mimeType: String, size: Number }],
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "TaskComment" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isEdited: Boolean
}, { timestamps: true });

module.exports = mongoose.models.TaskComment || mongoose.model('TaskComment', schema);
