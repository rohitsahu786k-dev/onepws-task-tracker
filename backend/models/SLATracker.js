const mongoose = require('mongoose');

const { Schema } = mongoose;

const slaPhaseSchema = new Schema(
  {
    phaseKey: String,
    phaseName: String,
    order: Number,
    plannedStartDate: Date,
    plannedEndDate: Date,
    actualStartDate: Date,
    actualEndDate: Date,
    durationWorkingDays: Number,
    responsibleRole: String,
    responsibleUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'delayed', 'skipped', 'cancelled'],
      default: 'pending',
    },
    delayDays: { type: Number, default: 0 },
    delayReason: String,
    requiresApproval: Boolean,
    requiresFeedback: Boolean,
    feedbackDueDate: Date,
    feedbackReceivedAt: Date,
    calendarEvent: { type: Schema.Types.ObjectId, ref: 'CalendarEvent' },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: Date,
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
  },
  { _id: true }
);

const slaTrackerSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    intakeForm: { type: Schema.Types.ObjectId, ref: 'IntakeForm' },
    slaConfig: { type: Schema.Types.ObjectId, ref: 'SLAConfig', required: true },
    deliverableType: String,
    requestType: String,
    t0Date: { type: Date, required: true },
    t0ConfirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    t0ConfirmedAt: Date,
    kickoffMeetingDate: Date,
    momSignedAt: Date,
    finalDueDate: Date,
    currentPhaseKey: String,
    currentPhaseName: String,
    currentPhase: String,
    phases: [slaPhaseSchema],
    feedback: {
      requestedAt: Date,
      dueAt: Date,
      receivedAt: Date,
      status: {
        type: String,
        enum: ['not_required', 'pending', 'received', 'delayed', 'auto_hold', 'auto_closed'],
        default: 'not_required',
      },
      delayDays: Number,
      requestedFrom: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    overallStatus: {
      type: String,
      enum: ['not_started', 'on_track', 'at_risk', 'breached', 'completed', 'on_hold', 'cancelled'],
      default: 'not_started',
    },
    totalDelayDays: { type: Number, default: 0 },
    breachReason: String,
    escalationLevel: { type: Number, default: 0 },
    isT0Reset: { type: Boolean, default: false },
    t0ResetCount: { type: Number, default: 0 },
    t0ResetReason: String,
    t0ResetAt: Date,
    t0ResetBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resetHistory: [
      {
        oldT0Date: Date,
        newT0Date: Date,
        reason: String,
        changePercent: Number,
        resetBy: { type: Schema.Types.ObjectId, ref: 'User' },
        resetAt: Date,
      },
    ],
    completedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

slaTrackerSchema.pre('validate', function normalizeCurrentPhase(next) {
  if (!this.currentPhaseKey && this.currentPhase) this.currentPhaseKey = this.currentPhase;
  if (!this.currentPhase && this.currentPhaseKey) this.currentPhase = this.currentPhaseKey;
  next();
});

slaTrackerSchema.index({ workspace: 1, task: 1 }, { unique: true });
slaTrackerSchema.index({ workspace: 1, overallStatus: 1 });
slaTrackerSchema.index({ workspace: 1, finalDueDate: 1 });
slaTrackerSchema.index({ workspace: 1, currentPhaseKey: 1 });
slaTrackerSchema.index({ workspace: 1, escalationLevel: 1 });
slaTrackerSchema.index({ workspace: 1, deliverableType: 1 });
slaTrackerSchema.index({ workspace: 1, requestType: 1 });
slaTrackerSchema.index({ workspace: 1, t0Date: 1 });

module.exports = mongoose.models.SLATracker || mongoose.model('SLATracker', slaTrackerSchema);
