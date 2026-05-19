const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  key: { type: String, required: true },
  name: { type: String, required: true },
  icon: String,
  color: String,
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

schema.index({ workspace: 1, key: 1 }, { unique: true });

module.exports = mongoose.models.ContentPlatform || mongoose.model('ContentPlatform', schema);
