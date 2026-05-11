const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  title: { type: String, required: true },
  description: String,
  eventType: {
    type: String,
    enum: ["task", "tracker_task", "meeting", "mom", "sla", "budget", "expense", "holiday", "reminder", "custom"],
    required: true
  },
  startDate: Date,
  endDate: Date,
  allDay: { type: Boolean, default: false },
  color: String,
  status: {
    type: String,
    enum: ["scheduled", "pending", "in_progress", "completed", "overdue", "cancelled"],
    default: "scheduled"
  },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  refModel: { type: String, enum: ["Task", "TrackerRow", "Meeting", "MOM", "SLATracker", "Budget", "Expense", "Holiday", null] },
  refId: mongoose.Schema.Types.ObjectId,
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  isSystemGenerated: { type: Boolean, default: false },
  isEditable: { type: Boolean, default: true },
  isRecurring: Boolean,
  recurrenceRule: {
    frequency: { type: String, enum: ["daily", "weekly", "monthly", "yearly"] },
    interval: Number,
    daysOfWeek: [String],
    dayOfMonth: Number,
    endDate: Date,
    maxOccurrences: Number
  },
  reminders: [{
    minutesBefore: Number,
    channel: { type: String, enum: ["in_app", "email", "both"], default: "in_app" },
    sent: { type: Boolean, default: false },
    sentAt: Date
  }],
  metadata: {
    source: String,
    sourceNumber: String,
    sourceStatus: String,
    sourceUrl: String,
    phaseKey: String,
    phaseName: String,
    taskNumber: String,
    meetingLink: String,
    locationType: String,
    cancelledReason: String,
    actualCompletionDate: Date
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

schema.index({ workspace: 1, startDate: 1, endDate: 1 });
schema.index({ workspace: 1, refModel: 1, refId: 1, eventType: 1 });
schema.index({ workspace: 1, assignedTo: 1, startDate: 1 });

module.exports = mongoose.models.CalendarEvent || mongoose.model('CalendarEvent', schema);
