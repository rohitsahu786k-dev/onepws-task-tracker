const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  folder: { type: mongoose.Schema.Types.ObjectId, ref: "MediaFolder" },
  originalName: String, storedName: String, filePath: String, fileUrl: String,
  thumbnailPath: String, thumbnailUrl: String,
  mimeType: String, extension: String, size: Number,
  fileCategory: { type: String, enum: ["image", "document", "video", "audio", "archive", "other"] },
  dimensions: { width: Number, height: Number },
  altText: String, description: String, tags: [String],
  version: { type: Number, default: 1 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  usage: [{ refModel: String, refId: mongoose.Schema.Types.ObjectId, usedAt: Date }],
  isDeleted: Boolean, deletedAt: Date, deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.MediaFile || mongoose.model('MediaFile', schema);
