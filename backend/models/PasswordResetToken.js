const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
  used: { type: Boolean, default: false },
  usedAt: Date,
  ipAddress: String
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.models.PasswordResetToken || mongoose.model('PasswordResetToken', schema);
