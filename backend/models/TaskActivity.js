const mongoose = require('mongoose');

const { Schema } = mongoose;

const taskActivitySchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    action: {
      type: String,
      enum: [
        'created',
        'updated',
        'assigned',
        'unassigned',
        'stage_changed',
        'status_changed',
        'priority_changed',
        'due_date_changed',
        'comment_added',
        'attachment_added',
        'checklist_updated',
        'subtask_created',
        'dependency_added',
        'submitted',
        'closed',
        'reopened',
        'cancelled',
        'put_on_hold',
        'timer_started',
        'timer_stopped',
        'approval_requested',
        'approved',
        'rejected',
        'deleted',
        'restored',
      ],
      required: true,
    },
    message: String,
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

taskActivitySchema.index({ workspace: 1, task: 1, createdAt: -1 });
taskActivitySchema.index({ task: 1, createdAt: -1 });

module.exports = mongoose.models.TaskActivity || mongoose.model('TaskActivity', taskActivitySchema);
