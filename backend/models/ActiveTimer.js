const mongoose = require('mongoose');

const { Schema } = mongoose;

const activeTimerSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    startedAt: { type: Date, default: Date.now },
    pausedAt: Date,
    pausedDurationMinutes: { type: Number, default: 0 },
    status: { type: String, enum: ['running', 'paused', 'stopped'], default: 'running' },
  },
  { timestamps: true }
);

activeTimerSchema.index({ workspace: 1, user: 1, status: 1 });
activeTimerSchema.index({ workspace: 1, task: 1 });

module.exports = mongoose.models.ActiveTimer || mongoose.model('ActiveTimer', activeTimerSchema);
