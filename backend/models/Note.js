const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  title: String, content: String, contentHtml: String, tags: [String], folder: String,
  linkedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
  linkedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
  visibility: { type: String, enum: ["private", "shared", "workspace"], default: "private" },
  sharedWith: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, permission: { type: String, enum: ["view", "edit"] } }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.Note || mongoose.model('Note', schema);
