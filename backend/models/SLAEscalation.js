const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  slaTracker: { type: mongoose.Schema.Types.ObjectId, ref: "SLATracker" },
  escalationLevel: Number, delayDays: Number,
  escalatedTo: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, role: String }],
  message: String,
  status: { type: String, enum: ["sent", "acknowledged", "resolved"], default: "sent" },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, acknowledgedAt: Date,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, resolvedAt: Date
}, { timestamps: true });

module.exports = mongoose.models.SLAEscalation || mongoose.model('SLAEscalation', schema);
