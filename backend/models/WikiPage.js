const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  title: String, slug: String, content: String, contentHtml: String,
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  parentPage: { type: mongoose.Schema.Types.ObjectId, ref: "WikiPage" },
  tags: [String],
  visibility: { type: String, enum: ["workspace", "department", "restricted"], default: "workspace" },
  allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  version: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.WikiPage || mongoose.model('WikiPage', schema);
