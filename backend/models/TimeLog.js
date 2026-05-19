const mongoose = require('mongoose');

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const timeLogSchema = new Schema(
  {
    workspace: { type: ObjectId, ref: 'Workspace', required: true },
    user: { type: ObjectId, ref: 'User', required: true },
    department: { type: ObjectId, ref: 'Department' },
    project: { type: ObjectId, ref: 'Project' },
    task: { type: ObjectId, ref: 'Task' },
    timesheet: { type: ObjectId, ref: 'Timesheet' },

    logDate: { type: Date, required: true },
    startTime: Date,
    endTime: Date,
    durationMinutes: { type: Number, required: true, min: 1 },
    durationHours: { type: Number, default: 0 },

    workType: {
      type: String,
      enum: ['task_work', 'meeting', 'review', 'planning', 'coordination', 'revision', 'approval', 'admin', 'training', 'other'],
      default: 'task_work',
    },
    description: { type: String, required: true, trim: true },
    source: { type: String, enum: ['manual', 'timer', 'import', 'system'], default: 'manual' },
    timerSession: {
      startedAt: Date,
      stoppedAt: Date,
      pausedDurationMinutes: { type: Number, default: 0 },
    },

    billable: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
    approvalStatus: { type: String, enum: ['draft', 'submitted', 'approved', 'rejected'], default: 'draft' },
    rejectionReason: String,
    approvedBy: { type: ObjectId, ref: 'User' },
    approvedAt: Date,
    rejectedBy: { type: ObjectId, ref: 'User' },
    rejectedAt: Date,

    isLocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: ObjectId, ref: 'User' },
    createdBy: { type: ObjectId, ref: 'User' },
    updatedBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

timeLogSchema.pre('validate', function normalizeDuration(next) {
  if (this.durationMinutes) {
    this.durationHours = Number((Number(this.durationMinutes) / 60).toFixed(2));
  }
  if (this.logDate) {
    const date = new Date(this.logDate);
    date.setHours(0, 0, 0, 0);
    this.logDate = date;
  }
  next();
});

timeLogSchema.index({ workspace: 1, user: 1, logDate: -1 });
timeLogSchema.index({ workspace: 1, task: 1 });
timeLogSchema.index({ workspace: 1, project: 1 });
timeLogSchema.index({ workspace: 1, department: 1 });
timeLogSchema.index({ workspace: 1, approvalStatus: 1 });
timeLogSchema.index({ workspace: 1, timesheet: 1 });
timeLogSchema.index({ workspace: 1, createdAt: -1 });

module.exports = mongoose.models.TimeLog || mongoose.model('TimeLog', timeLogSchema);
