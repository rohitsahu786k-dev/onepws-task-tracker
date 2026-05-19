const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  title: String, description: String,
  milestoneNumber: Number,
  startDate: Date, dueDate: Date, completedAt: Date,
  responsiblePerson: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "in_progress", "completed", "delayed", "cancelled"], default: "pending" },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  order: Number,
  linkedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
  delayDays: Number,
  remarks: String,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

schema.index({ workspace: 1, project: 1 });
schema.index({ workspace: 1, dueDate: 1 });
schema.index({ project: 1, order: 1 });

module.exports = mongoose.models.Milestone || mongoose.model('Milestone', schema);
