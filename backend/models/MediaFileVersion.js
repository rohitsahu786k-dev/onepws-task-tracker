const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  mediaFile: { type: mongoose.Schema.Types.ObjectId, ref: "MediaFile" },
  versionNumber: Number,
  originalName: String, storedName: String, filePath: String, fileUrl: String,
  size: Number, mimeType: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.MediaFileVersion || mongoose.model('MediaFileVersion', schema);
