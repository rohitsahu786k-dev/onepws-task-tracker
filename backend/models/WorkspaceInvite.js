const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  email: { type: String, required: true, lowercase: true },
  name: String,
  role: { type: String, enum: ["admin", "manager", "member", "viewer"], default: "member" },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  designation: String,
  allowedModulesOverride: [String],
  deniedModulesOverride: [String],
  tokenHash: { type: String, index: true },
  token: { type: String, select: false },
  expiresAt: Date,
  status: { type: String, enum: ["pending", "accepted", "expired", "cancelled"], default: "pending" },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  acceptedAt: Date
}, { timestamps: true });

schema.index({ workspace: 1, email: 1 });
schema.index({ expiresAt: 1 });

module.exports = mongoose.models.WorkspaceInvite || mongoose.model('WorkspaceInvite', schema);
