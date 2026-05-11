const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  approvalChain: { type: mongoose.Schema.Types.ObjectId, ref: "ApprovalChain" },
  refModel: String, refId: mongoose.Schema.Types.ObjectId, currentStepOrder: Number,
  status: { type: String, enum: ["pending", "approved", "rejected", "cancelled"], default: "pending" },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  finalApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, finalApprovedAt: Date,
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, rejectedAt: Date, rejectionReason: String
}, { timestamps: true });

module.exports = mongoose.models.ApprovalRequest || mongoose.model('ApprovalRequest', schema);
