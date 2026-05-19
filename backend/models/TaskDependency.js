const mongoose = require('mongoose');

const { Schema } = mongoose;

const taskDependencySchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    dependsOnTask: { type: Schema.Types.ObjectId, ref: 'Task' },
    dependencyTask: { type: Schema.Types.ObjectId, ref: 'Task' },
    dependencyType: {
      type: String,
      enum: ['blocks', 'blocked_by', 'related', 'relates_to', 'duplicates', 'parent_child'],
      default: 'blocked_by',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

taskDependencySchema.pre('validate', function normalizeDependency(next) {
  if (!this.dependsOnTask && this.dependencyTask) this.dependsOnTask = this.dependencyTask;
  if (!this.dependencyTask && this.dependsOnTask) this.dependencyTask = this.dependsOnTask;
  if (this.dependencyType === 'relates_to') this.dependencyType = 'related';
  next();
});

taskDependencySchema.index({ workspace: 1, task: 1 });
taskDependencySchema.index({ workspace: 1, dependsOnTask: 1 });
taskDependencySchema.index({ workspace: 1, task: 1, dependsOnTask: 1 }, { unique: true });

module.exports = mongoose.models.TaskDependency || mongoose.model('TaskDependency', taskDependencySchema);
