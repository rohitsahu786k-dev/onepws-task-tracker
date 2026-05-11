const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  deliverableType: { type: String, enum: ["CAT-S", "CAT-M", "CAT-L", "BROCHURE", "FLYER", "SOCIAL", "PPT-S", "PPT-L", "EMAIL", "EVENT", "WEB"], required: true },
  title: String, newWorkTotalDays: Number, reworkTotalDays: Number,
  phases: [{ phaseName: String, phaseKey: String, order: Number, newWorkDays: Number, reworkDays: Number, responsibleRole: String, requiresApproval: Boolean }],
  rules: { dayZeroStartsAfterCompleteInput: Boolean, kickoffMeetingRequired: Boolean, momRequiredBeforeStart: Boolean, maxDraftCycles: Number, feedbackWithinWorkingDays: Number, autoHoldAfterNoFeedbackDays: Number, autoCloseAfterNoFeedbackDays: Number, changeAboveThirtyPercentResetT0: Boolean },
  escalationMatrix: [{ delayDays: Number, escalateToRole: String, escalateToUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, action: String }],
  isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.SLAConfig || mongoose.model('SLAConfig', schema);
