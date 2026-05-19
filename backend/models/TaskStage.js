const mongoose = require('mongoose');

const { Schema } = mongoose;

const taskStageSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true, lowercase: true },
    description: String,
    order: { type: Number, default: 0 },
    color: String,
    icon: String,
    mappedStatus: {
      type: String,
      enum: [
        'open',
        'in_progress',
        'in_review',
        'waiting_for_input',
        'waiting_for_feedback',
        'on_hold',
        'submitted',
        'closed',
        'cancelled',
      ],
      default: 'open',
    },
    type: {
      type: String,
      enum: ['todo', 'in_progress', 'review', 'blocked', 'done', 'custom'],
      default: 'custom',
    },
    isDefault: { type: Boolean, default: false },
    isFinal: { type: Boolean, default: false },
    isFinalStage: { type: Boolean, default: false },
    isSystem: { type: Boolean, default: false },
    allowedRolesToMove: [String],
    automation: {
      setSubmittedAt: { type: Boolean, default: false },
      setClosedAt: { type: Boolean, default: false },
      lockTask: { type: Boolean, default: false },
      notifyRequester: { type: Boolean, default: false },
      requireApproval: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

taskStageSchema.pre('validate', function normalizeStage(next) {
  if (!this.key && this.name) {
    this.key = this.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
  if (this.isFinalStage) this.isFinal = true;
  if (this.isFinal) this.isFinalStage = true;
  next();
});

taskStageSchema.index({ workspace: 1, order: 1 });
taskStageSchema.index({ workspace: 1, key: 1 }, { unique: true });

module.exports = mongoose.models.TaskStage || mongoose.model('TaskStage', taskStageSchema);
