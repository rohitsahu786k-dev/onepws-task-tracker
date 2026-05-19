const mongoose = require('mongoose');

const { Schema } = mongoose;

const slaEscalationSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    slaTracker: { type: Schema.Types.ObjectId, ref: 'SLATracker', required: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task' },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    phaseKey: String,
    phaseName: String,
    level: { type: Number, required: true },
    escalationLevel: Number,
    delayDays: Number,
    reason: String,
    message: String,
    recipients: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        role: String,
        notifiedAt: Date,
        channels: {
          inApp: Boolean,
          email: Boolean,
          slack: Boolean,
          telegram: Boolean,
        },
      },
    ],
    escalatedTo: [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, role: String }],
    status: { type: String, enum: ['open', 'acknowledged', 'resolved', 'ignored', 'sent'], default: 'open' },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: Date,
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
    resolutionNote: String,
    requiresCAPA: { type: Boolean, default: false },
    capaStatus: {
      type: String,
      enum: ['not_required', 'pending', 'submitted', 'approved'],
      default: 'not_required',
    },
  },
  { timestamps: true }
);

slaEscalationSchema.pre('validate', function normalizeEscalation(next) {
  if (!this.level && this.escalationLevel) this.level = this.escalationLevel;
  if (!this.escalationLevel && this.level) this.escalationLevel = this.level;
  if (!this.recipients?.length && this.escalatedTo?.length) {
    this.recipients = this.escalatedTo.map((item) => ({ ...item, notifiedAt: new Date() }));
  }
  if (!this.escalatedTo?.length && this.recipients?.length) {
    this.escalatedTo = this.recipients.map((item) => ({ user: item.user, role: item.role }));
  }
  if (!this.reason && this.message) this.reason = this.message;
  if (!this.message && this.reason) this.message = this.reason;
  next();
});

slaEscalationSchema.index({ workspace: 1, slaTracker: 1 });
slaEscalationSchema.index({ workspace: 1, task: 1 });
slaEscalationSchema.index({ workspace: 1, level: 1 });
slaEscalationSchema.index({ workspace: 1, status: 1 });
slaEscalationSchema.index({ workspace: 1, createdAt: -1 });
slaEscalationSchema.index({ workspace: 1, slaTracker: 1, phaseKey: 1, level: 1 }, { unique: true });

module.exports = mongoose.models.SLAEscalation || mongoose.model('SLAEscalation', slaEscalationSchema);
