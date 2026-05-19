const mongoose = require('mongoose');

const { Schema } = mongoose;

const slaResetLogSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    slaTracker: { type: Schema.Types.ObjectId, ref: 'SLATracker', required: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task' },
    oldT0Date: Date,
    newT0Date: Date,
    reason: String,
    changePercent: Number,
    oldFinalDueDate: Date,
    newFinalDueDate: Date,
    oldPhases: Schema.Types.Mixed,
    newPhases: Schema.Types.Mixed,
    resetBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

slaResetLogSchema.index({ workspace: 1, slaTracker: 1, createdAt: -1 });
slaResetLogSchema.index({ workspace: 1, task: 1 });

module.exports = mongoose.models.SLAResetLog || mongoose.model('SLAResetLog', slaResetLogSchema);
