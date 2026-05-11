const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  parentTask: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  title: String, description: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "in_progress", "completed"], default: "pending" },
  dueDate: Date, completedAt: Date, order: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.SubTask || mongoose.model('SubTask', schema);
