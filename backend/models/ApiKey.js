const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String, keyHash: String,
  permissions: [{ module: String, actions: [String] }],
  lastUsedAt: Date, expiresAt: Date, isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.APIKey || mongoose.model('APIKey', schema);
