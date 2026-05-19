const mongoose = require('mongoose');

const { Schema } = mongoose;

const taskChecklistSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    title: { type: String, required: true, trim: true },
    isCompleted: { type: Boolean, default: false },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: Date,
    order: Number,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

taskChecklistSchema.index({ workspace: 1, task: 1, order: 1 });

module.exports = mongoose.models.TaskChecklist || mongoose.model('TaskChecklist', taskChecklistSchema);
