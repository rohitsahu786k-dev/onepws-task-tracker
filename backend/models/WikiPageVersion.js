const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  page: { type: mongoose.Schema.Types.ObjectId, ref: "WikiPage" },
  versionNumber: Number, title: String, content: String, contentHtml: String,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  changeSummary: String
}, { timestamps: false });

module.exports = mongoose.models.WikiPageVersion || mongoose.model('WikiPageVersion', schema);
