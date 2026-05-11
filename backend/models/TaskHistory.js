const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  action: { type: String, enum: ["created", "updated", "stage_changed", "assigned", "commented", "attachment_added", "status_changed", "due_date_changed", "deleted", "restored"] },
  fieldChanged: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  message: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  ipAddress: String, userAgent: String
}, { timestamps: false });

module.exports = mongoose.models.TaskHistory || mongoose.model('TaskHistory', schema);
