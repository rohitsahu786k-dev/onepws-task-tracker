const mongoose = require('mongoose');

const { Schema } = mongoose;

const taskTimerSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: Date,
    stoppedAt: Date,
    durationMinutes: { type: Number, default: 0 },
    durationSeconds: Number,
    description: String,
    note: String,
    source: { type: String, enum: ['timer', 'manual'], default: 'timer' },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    status: { type: String, enum: ['running', 'stopped'], default: 'running' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

taskTimerSchema.pre('validate', function normalizeDuration(next) {
  if (!this.description && this.note) this.description = this.note;
  if (!this.note && this.description) this.note = this.description;
  if (this.durationSeconds && !this.durationMinutes) {
    this.durationMinutes = Math.round(this.durationSeconds / 60);
  }
  if (this.durationMinutes && !this.durationSeconds) {
    this.durationSeconds = Math.round(this.durationMinutes * 60);
  }
  next();
});

taskTimerSchema.index({ workspace: 1, task: 1 });
taskTimerSchema.index({ workspace: 1, user: 1 });
taskTimerSchema.index({ workspace: 1, startedAt: -1 });

module.exports = mongoose.models.TaskTimer || mongoose.model('TaskTimer', taskTimerSchema);
