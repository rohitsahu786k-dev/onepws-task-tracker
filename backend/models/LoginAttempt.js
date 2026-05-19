const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  email: { type: String, lowercase: true, trim: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ipAddress: String,
  userAgent: String,
  status: { type: String, enum: ['success', 'failed', 'blocked'], required: true },
  reason: String
}, { timestamps: { createdAt: true, updatedAt: false } });

schema.index({ email: 1, createdAt: -1 });
schema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.models.LoginAttempt || mongoose.model('LoginAttempt', schema);
