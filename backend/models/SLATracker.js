const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  slaConfig: { type: mongoose.Schema.Types.ObjectId, ref: "SLAConfig" },
  requestType: { type: String, enum: ["new_work", "rework"] },
  t0Date: Date, kickoffMeetingDate: Date, momSignedAt: Date, currentPhase: String,
  phases: [{
    phaseName: String, phaseKey: String, order: Number,
    plannedStartDate: Date, plannedEndDate: Date, actualStartDate: Date, actualEndDate: Date,
    status: { type: String, enum: ["pending", "in_progress", "completed", "delayed", "skipped"], default: "pending" },
    delayDays: Number, approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, approvedAt: Date
  }],
  overallStatus: { type: String, enum: ["on_track", "at_risk", "breached", "completed", "on_hold"], default: "on_track" },
  totalDelayDays: Number,
  isT0Reset: Boolean, t0ResetReason: String, t0ResetAt: Date, t0ResetBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.SLATracker || mongoose.model('SLATracker', schema);
