const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  version: String, title: String, description: String,
  changes: [{ type: { type: String, enum: ["feature", "improvement", "bugfix", "security"] }, text: String }],
  publishedAt: Date, publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isActive: Boolean
}, { timestamps: true });

module.exports = mongoose.models.Changelog || mongoose.model('Changelog', schema);
