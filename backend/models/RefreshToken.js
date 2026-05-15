const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, index: true },
  deviceId: String,
  ipAddress: String,
  userAgent: String,
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  revokedAt: Date,
  replacedByTokenHash: String,
}, { timestamps: true });

module.exports = mongoose.models.RefreshToken || mongoose.model('RefreshToken', schema);
