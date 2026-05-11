const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  meetingNumber: { type: String, unique: true, sparse: true },
  title: { type: String, required: true },
  description: String,
  agenda: String,
  meetingType: {
    type: String,
    enum: ['kickoff', 'internal', 'client', 'vendor', 'design_review', 'sla_review', 'budget_review', 'project_review', 'mom_discussion', 'general'],
    default: 'general'
  },
  meetingMode: {
    type: String,
    enum: ['physical', 'zoom', 'google_meet', 'manual_link', 'hybrid'],
    default: 'physical'
  },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  intakeForm: { type: mongoose.Schema.Types.ObjectId, ref: 'IntakeForm' },
  slaTracker: { type: mongoose.Schema.Types.ObjectId, ref: 'SLATracker' },
  budget: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget' },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  durationMinutes: Number,
  timezone: { type: String, default: 'Asia/Kolkata' },
  location: String,
  manualMeetingLink: String,
  onlineMeeting: {
    provider: { type: String, enum: ['zoom', 'google_meet', 'manual', null], default: null },
    joinUrl: String,
    startUrl: String,
    meetingId: String,
    password: String,
    providerResponse: mongoose.Schema.Types.Mixed
  },
  attendees: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    designation: String,
    attendeeType: { type: String, enum: ['internal', 'external'], default: 'internal' },
    responseStatus: { type: String, enum: ['pending', 'accepted', 'declined', 'tentative'], default: 'pending' },
    responseAt: Date
  }],
  externalAttendees: [{
    name: String,
    email: String,
    company: String,
    phone: String,
    designation: String,
    responseStatus: { type: String, enum: ['pending', 'accepted', 'declined', 'tentative'], default: 'pending' }
  }],
  reminders: [{
    minutesBefore: Number,
    channel: { type: String, enum: ['in_app', 'email', 'both'], default: 'both' },
    sent: { type: Boolean, default: false },
    sentAt: Date
  }],
  attachments: [{
    mediaFile: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaFile' },
    fileName: String,
    fileUrl: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: Date
  }],
  calendarEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'CalendarEvent' },
  mom: { type: mongoose.Schema.Types.ObjectId, ref: 'MOM' },
  status: {
    type: String,
    enum: ['scheduled', 'rescheduled', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  cancellationReason: String,
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelledAt: Date,
  completedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

meetingSchema.virtual('meetingLink').get(function () {
  return this.onlineMeeting?.joinUrl || this.manualMeetingLink || this.location;
});

meetingSchema.index({ workspace: 1, startDateTime: 1 });
meetingSchema.index({ workspace: 1, status: 1 });
meetingSchema.index({ workspace: 1, meetingType: 1 });
meetingSchema.index({ workspace: 1, meetingMode: 1 });
meetingSchema.index({ workspace: 1, 'attendees.user': 1, startDateTime: 1, endDateTime: 1 });
meetingSchema.index({ workspace: 1, project: 1 });
meetingSchema.index({ workspace: 1, task: 1 });

module.exports = mongoose.models.Meeting || mongoose.model('Meeting', meetingSchema);
