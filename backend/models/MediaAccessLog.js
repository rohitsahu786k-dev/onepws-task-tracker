const mongoose = require('mongoose');

const mediaAccessLogSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  mediaFile: { type: mongoose.Schema.Types.ObjectId, ref: "MediaFile" },
  action: {
    type: String,
    enum: ["uploaded", "previewed", "downloaded", "renamed", "moved", "deleted", "restored", "version_uploaded", "shared", "permission_changed"]
  },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  ipAddress: String,
  userAgent: String,
  metadata: Object,
  createdAt: { type: Date, default: Date.now }
});

mediaAccessLogSchema.index({ workspace: 1, mediaFile: 1 });
mediaAccessLogSchema.index({ workspace: 1, action: 1 });
mediaAccessLogSchema.index({ workspace: 1, createdAt: 1 });

module.exports = mongoose.model('MediaAccessLog', mediaAccessLogSchema);
