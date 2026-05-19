const mongoose = require('mongoose');

const { Schema } = mongoose;

const recurringTaskSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    sourceTask: { type: Schema.Types.ObjectId, ref: 'Task' },
    template: { type: Schema.Types.ObjectId, ref: 'TaskTemplate' },
    title: { type: String, required: true },
    payload: { type: Map, of: Schema.Types.Mixed },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
    interval: { type: Number, default: 1 },
    nextRunAt: { type: Date, required: true },
    endDate: Date,
    lastRunAt: Date,
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

recurringTaskSchema.index({ workspace: 1, isActive: 1, nextRunAt: 1 });

module.exports = mongoose.models.RecurringTask || mongoose.model('RecurringTask', recurringTaskSchema);
