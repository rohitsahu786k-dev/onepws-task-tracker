const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  refreshToken: { type: String, required: true },
  deviceName: String,
  browser: String,
  os: String,
  ipAddress: String,
  location: { country: String, city: String },
  userAgent: String,
  isRevoked: { type: Boolean, default: false },
  lastActiveAt: Date,
  expiresAt: Date
}, { timestamps: true });

module.exports = mongoose.models.Session || mongoose.model('Session', schema);
