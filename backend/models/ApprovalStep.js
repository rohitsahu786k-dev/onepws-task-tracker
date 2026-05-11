const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  approvalRequest: { type: mongoose.Schema.Types.ObjectId, ref: "ApprovalRequest" },
  order: Number, approver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "approved", "rejected", "skipped"], default: "pending" },
  comments: String, actedAt: Date
}, { timestamps: true });

module.exports = mongoose.models.ApprovalStep || mongoose.model('ApprovalStep', schema);
