const mongoose = require('mongoose');

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const dailySummarySchema = new Schema(
  {
    date: Date,
    totalMinutes: { type: Number, default: 0 },
    expectedMinutes: { type: Number, default: 0 },
    overtimeMinutes: { type: Number, default: 0 },
    missingMinutes: { type: Number, default: 0 },
    status: { type: String, enum: ['complete', 'incomplete', 'leave', 'holiday', 'weekend'], default: 'incomplete' },
  },
  { _id: false }
);

const timesheetSchema = new Schema(
  {
    workspace: { type: ObjectId, ref: 'Workspace', required: true },
    user: { type: ObjectId, ref: 'User', required: true },
    department: { type: ObjectId, ref: 'Department' },

    periodType: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    weekNumber: Number,
    month: Number,
    year: Number,

    totalMinutes: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },
    billableMinutes: { type: Number, default: 0 },
    nonBillableMinutes: { type: Number, default: 0 },
    overtimeMinutes: { type: Number, default: 0 },
    expectedMinutes: { type: Number, default: 0 },
    missingMinutes: { type: Number, default: 0 },

    dailySummary: [dailySummarySchema],
    projectSummary: [
      {
        project: { type: ObjectId, ref: 'Project' },
        totalMinutes: { type: Number, default: 0 },
        totalHours: { type: Number, default: 0 },
      },
    ],
    taskSummary: [
      {
        task: { type: ObjectId, ref: 'Task' },
        totalMinutes: { type: Number, default: 0 },
        totalHours: { type: Number, default: 0 },
      },
    ],

    status: { type: String, enum: ['draft', 'submitted', 'approved', 'rejected', 'reopened', 'locked'], default: 'draft' },
    submittedAt: Date,
    submittedBy: { type: ObjectId, ref: 'User' },
    approval: {
      approver: { type: ObjectId, ref: 'User' },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      comment: String,
      approvedAt: Date,
      rejectedAt: Date,
      rejectionReason: String,
    },
    notes: String,
    isLocked: { type: Boolean, default: false },
    lockedAt: Date,
    lockedBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

timesheetSchema.pre('validate', function normalizePeriod(next) {
  if (this.periodStart) {
    const start = new Date(this.periodStart);
    start.setHours(0, 0, 0, 0);
    this.periodStart = start;
  }
  if (this.periodEnd) {
    const end = new Date(this.periodEnd);
    end.setHours(23, 59, 59, 999);
    this.periodEnd = end;
  }
  if (this.periodStart) {
    this.month = this.periodStart.getMonth() + 1;
    this.year = this.periodStart.getFullYear();
  }
  next();
});

timesheetSchema.index({ workspace: 1, user: 1, periodStart: 1, periodEnd: 1 }, { unique: true });
timesheetSchema.index({ workspace: 1, status: 1 });
timesheetSchema.index({ workspace: 1, department: 1 });
timesheetSchema.index({ workspace: 1, 'approval.approver': 1 });
timesheetSchema.index({ workspace: 1, periodStart: -1 });

module.exports = mongoose.models.Timesheet || mongoose.model('Timesheet', timesheetSchema);
