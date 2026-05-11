const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  email: { type: String, required: true, lowercase: true },
  role: { type: String, enum: ["admin", "manager", "member", "viewer"], default: "member" },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  token: String,
  expiresAt: Date,
  status: { type: String, enum: ["pending", "accepted", "expired", "cancelled"], default: "pending" },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  acceptedAt: Date
}, { timestamps: true });

module.exports = mongoose.models.WorkspaceInvite || mongoose.model('WorkspaceInvite', schema);
