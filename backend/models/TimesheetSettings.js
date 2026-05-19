const mongoose = require('mongoose');

const { Schema } = mongoose;

const timesheetSettingsSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, unique: true },
    enabled: { type: Boolean, default: true },
    periodType: { type: String, enum: ['weekly', 'monthly'], default: 'weekly' },
    weekStartDay: { type: String, enum: ['monday', 'sunday'], default: 'monday' },
    expectedHoursPerDay: { type: Number, default: 8 },
    expectedHoursPerWeek: { type: Number, default: 40 },
    allowManualEntry: { type: Boolean, default: true },
    allowTimer: { type: Boolean, default: true },
    allowFutureTimeLog: { type: Boolean, default: false },
    allowPastDateEdit: { type: Boolean, default: true },
    pastDateEditLimitDays: { type: Number, default: 7 },
    requireTaskForTimeLog: { type: Boolean, default: true },
    requireDescription: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: true },
    autoSubmitWeekly: { type: Boolean, default: false },
    autoLockAfterApproval: { type: Boolean, default: true },
    reminderDay: { type: String, enum: ['friday', 'saturday', 'monday'], default: 'friday' },
    reminderTime: { type: String, default: '17:00' },
    defaultApproverRole: { type: String, enum: ['manager', 'admin', 'department_head'], default: 'manager' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.TimesheetSettings || mongoose.model('TimesheetSettings', timesheetSettingsSchema);
