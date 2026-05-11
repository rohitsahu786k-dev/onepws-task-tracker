const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  date: Date, hours: Number, minutes: Number, description: String,
  source: { type: String, enum: ["manual", "timer"], default: "manual" },
  timer: { type: mongoose.Schema.Types.ObjectId, ref: "TaskTimer" },
  status: { type: String, enum: ["draft", "submitted", "approved", "rejected"], default: "draft" },
  submittedAt: Date, approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, approvedAt: Date, rejectionReason: String
}, { timestamps: true });

module.exports = mongoose.models.Timesheet || mongoose.model('Timesheet', schema);
