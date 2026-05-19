const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  secret: { type: String, select: false },
  enabled: { type: Boolean, default: false },
  backupCodes: [{
    codeHash: String,
    used: { type: Boolean, default: false },
    usedAt: Date
  }],
  lastUsedAt: Date
}, { timestamps: true });

module.exports = mongoose.models.TwoFactorAuth || mongoose.model('TwoFactorAuth', schema);
