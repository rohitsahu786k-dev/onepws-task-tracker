const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String,
  appliesTo: { module: { type: String, enum: ["task", "budget", "expense", "mom", "intake"] }, taskCategory: String, deliverableType: String },
  steps: [{ order: Number, approverType: { type: String, enum: ["user", "role", "department_head", "project_manager"] }, user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, role: String, department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" }, isRequired: Boolean }],
  isActive: Boolean, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.ApprovalChain || mongoose.model('ApprovalChain', schema);
