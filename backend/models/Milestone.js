const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  title: String, description: String,
  dueDate: Date, completedAt: Date,
  responsiblePerson: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "in_progress", "completed", "delayed"], default: "pending" },
  order: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.Milestone || mongoose.model('Milestone', schema);
