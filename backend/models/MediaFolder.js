const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String,
  parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: "MediaFolder" },
  path: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.MediaFolder || mongoose.model('MediaFolder', schema);
