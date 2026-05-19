const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  refreshTokenHash: { type: String, required: true, index: true },
  refreshToken: { type: String, select: false },
  deviceId: String,
  deviceName: String,
  browser: String,
  os: String,
  ipAddress: String,
  location: { country: String, city: String, region: String },
  userAgent: String,
  isCurrent: { type: Boolean, default: false },
  isRevoked: { type: Boolean, default: false },
  revokedAt: Date,
  revokedReason: String,
  lastActiveAt: Date,
  expiresAt: Date
}, { timestamps: true });

schema.index({ user: 1, isRevoked: 1 });
schema.index({ expiresAt: 1 });

module.exports = mongoose.models.Session || mongoose.model('Session', schema);
