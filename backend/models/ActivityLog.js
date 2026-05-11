const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String, module: String, refModel: String, refId: mongoose.Schema.Types.ObjectId,
  description: String, oldValue: mongoose.Schema.Types.Mixed, newValue: mongoose.Schema.Types.Mixed,
  ipAddress: String, userAgent: String
}, { timestamps: false });

module.exports = mongoose.models.ActivityLog || mongoose.model('ActivityLog', schema);
