const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  dependsOnTask: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  dependencyType: { type: String, enum: ["blocks", "relates_to", "duplicates", "parent_child"], default: "blocks" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: false });

module.exports = mongoose.models.TaskDependency || mongoose.model('TaskDependency', schema);
