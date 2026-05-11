const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  title: { type: String, required: true },
  projectCode: { type: String, unique: true },
  description: String,
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  requestingDepartment: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, role: String }],
  status: { type: String, enum: ["planning", "active", "on_hold", "completed", "cancelled", "archived"], default: "planning" },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  startDate: Date, dueDate: Date, completedAt: Date,
  progressPercent: { type: Number, default: 0 },
  tags: [String],
  budget: { type: mongoose.Schema.Types.ObjectId, ref: "Budget" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.Project || mongoose.model('Project', schema);
