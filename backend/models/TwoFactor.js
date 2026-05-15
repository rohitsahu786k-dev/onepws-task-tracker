const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  secret: { type: String, required: true },
  backupCodes: [{ codeHash: String, usedAt: Date }],
  enabled: { type: Boolean, default: false },
  verifiedAt: Date,
}, { timestamps: true });

module.exports = mongoose.models.TwoFactor || mongoose.model('TwoFactor', schema);
