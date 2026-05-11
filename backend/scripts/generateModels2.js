const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../models');
const models = {};

// 17. TrackerFieldConfig
models['TrackerFieldConfig.js'] = `const mongoose = require('mongoose');
const trackerFieldConfigSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  name: { type: String, default: "Marketing Daily Task Tracker" },
  description: String,
  fields: [{
    fieldId: String,
    label: { type: String, required: true },
    fieldKey: { type: String, required: true },
    fieldType: { type: String, enum: ["text", "number", "date", "dropdown", "auto", "checkbox", "textarea", "user", "department", "file", "status"], required: true },
    isRequired: { type: Boolean, default: false },
    isEditable: { type: Boolean, default: true },
    isVisible: { type: Boolean, default: true },
    isSystem: { type: Boolean, default: false },
    isLockedAfterSubmit: { type: Boolean, default: false },
    order: Number, width: Number, placeholder: String, helpText: String, defaultValue: mongoose.Schema.Types.Mixed,
    dropdownOptions: [{ label: String, value: String, color: String, order: Number, isActive: Boolean }],
    validation: { min: Number, max: Number, regex: String, minLength: Number, maxLength: Number },
    autoFormula: {
      formulaType: { type: String, enum: ["serial_number", "task_number", "date_plus_working_days", "date_difference", "delay_status", "custom"] },
      sourceField: String, targetField: String, daysToAdd: Number, excludeWeekends: Boolean, excludeHolidays: Boolean, customExpression: String
    }
  }],
  isDefault: Boolean, isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
trackerFieldConfigSchema.index({ workspace: 1, name: 1 });
module.exports = mongoose.model('TrackerFieldConfig', trackerFieldConfigSchema);
`;

// 18. TrackerRow
models['TrackerRow.js'] = `const mongoose = require('mongoose');
const trackerRowSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  config: { type: mongoose.Schema.Types.ObjectId, ref: "TrackerFieldConfig", required: true },
  rowNumber: Number,
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  rowData: { type: Map, of: mongoose.Schema.Types.Mixed },
  calculatedData: { type: Map, of: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ["draft", "pending", "submitted", "locked", "archived"], default: "draft" },
  isLocked: { type: Boolean, default: false },
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  lockedAt: Date,
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  submittedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
trackerRowSchema.index({ workspace: 1, config: 1, rowNumber: 1 }, { unique: true });
trackerRowSchema.index({ workspace: 1, createdAt: 1 });
trackerRowSchema.index({ workspace: 1, status: 1 });
module.exports = mongoose.model('TrackerRow', trackerRowSchema);
`;

// 19. TrackerImport
models['TrackerImport.js'] = `const mongoose = require('mongoose');
const trackerImportSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  config: { type: mongoose.Schema.Types.ObjectId, ref: "TrackerFieldConfig" },
  originalFileName: String, filePath: String,
  totalRows: Number, successRows: Number, failedRows: Number,
  errors: [{ rowNumber: Number, fieldKey: String, message: String }],
  status: { type: String, enum: ["processing", "completed", "failed"], default: "processing" },
  importedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
module.exports = mongoose.model('TrackerImport', trackerImportSchema);
`;

// 20. SLAConfig
models['SLAConfig.js'] = `const mongoose = require('mongoose');
const slaConfigSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  deliverableType: { type: String, enum: ["CAT-S", "CAT-M", "CAT-L", "BROCHURE", "FLYER", "SOCIAL", "PPT-S", "PPT-L", "EMAIL", "EVENT", "WEB"], required: true },
  title: String, newWorkTotalDays: Number, reworkTotalDays: Number,
  phases: [{ phaseName: String, phaseKey: String, order: Number, newWorkDays: Number, reworkDays: Number, responsibleRole: String, requiresApproval: Boolean }],
  rules: { dayZeroStartsAfterCompleteInput: Boolean, kickoffMeetingRequired: Boolean, momRequiredBeforeStart: Boolean, maxDraftCycles: Number, feedbackWithinWorkingDays: Number, autoHoldAfterNoFeedbackDays: Number, autoCloseAfterNoFeedbackDays: Number, changeAboveThirtyPercentResetT0: Boolean },
  escalationMatrix: [{ delayDays: Number, escalateToRole: String, escalateToUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, action: String }],
  isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
slaConfigSchema.index({ workspace: 1, deliverableType: 1 }, { unique: true });
module.exports = mongoose.model('SLAConfig', slaConfigSchema);
`;

// 21. SLATracker
models['SLATracker.js'] = `const mongoose = require('mongoose');
const slaTrackerSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  slaConfig: { type: mongoose.Schema.Types.ObjectId, ref: "SLAConfig" },
  requestType: { type: String, enum: ["new_work", "rework"] },
  t0Date: Date, kickoffMeetingDate: Date, momSignedAt: Date, currentPhase: String,
  phases: [{ phaseName: String, phaseKey: String, order: Number, plannedStartDate: Date, plannedEndDate: Date, actualStartDate: Date, actualEndDate: Date, status: { type: String, enum: ["pending", "in_progress", "completed", "delayed", "skipped"], default: "pending" }, delayDays: Number, approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, approvedAt: Date }],
  overallStatus: { type: String, enum: ["on_track", "at_risk", "breached", "completed", "on_hold"], default: "on_track" },
  totalDelayDays: Number,
  isT0Reset: Boolean, t0ResetReason: String, t0ResetAt: Date, t0ResetBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
slaTrackerSchema.index({ workspace: 1, task: 1 }, { unique: true });
slaTrackerSchema.index({ workspace: 1, overallStatus: 1 });
module.exports = mongoose.model('SLATracker', slaTrackerSchema);
`;

// 22. SLAEscalation
models['SLAEscalation.js'] = `const mongoose = require('mongoose');
const slaEscalationSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  slaTracker: { type: mongoose.Schema.Types.ObjectId, ref: "SLATracker" },
  escalationLevel: Number, delayDays: Number,
  escalatedTo: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, role: String }],
  message: String,
  status: { type: String, enum: ["sent", "acknowledged", "resolved"], default: "sent" },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, acknowledgedAt: Date,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, resolvedAt: Date
}, { timestamps: true });
module.exports = mongoose.model('SLAEscalation', slaEscalationSchema);
`;

// 23. IntakeFormConfig
models['IntakeFormConfig.js'] = `const mongoose = require('mongoose');
const intakeFormConfigSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  deliverableType: { type: String, required: true },
  title: String, description: String,
  questions: [{ questionId: String, label: String, fieldKey: String, questionType: { type: String, enum: ["text", "textarea", "number", "date", "dropdown", "multi_select", "file", "checkbox", "radio"] }, priority: { type: String, enum: ["critical", "important", "useful"], default: "important" }, isRequired: Boolean, options: [{ label: String, value: String }], order: Number, helpText: String }],
  isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
module.exports = mongoose.model('IntakeFormConfig', intakeFormConfigSchema);
`;

// 24. IntakeForm
models['IntakeForm.js'] = `const mongoose = require('mongoose');
const intakeFormSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  formConfig: { type: mongoose.Schema.Types.ObjectId, ref: "IntakeFormConfig" },
  requestNumber: { type: String, unique: true },
  deliverableType: String,
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  requestingDepartment: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  answers: { type: Map, of: mongoose.Schema.Types.Mixed },
  attachments: [{ fileName: String, filePath: String, fileUrl: String, mimeType: String, size: Number }],
  status: { type: String, enum: ["draft", "submitted", "under_review", "approved", "rejected", "t0_confirmed", "task_created", "closed"], default: "draft" },
  review: { reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, reviewedAt: Date, remarks: String, rejectionReason: String },
  marketingConfirmationEmailSent: Boolean, t0Date: Date,
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" }
}, { timestamps: true });
intakeFormSchema.index({ workspace: 1, requestNumber: 1 }, { unique: true });
intakeFormSchema.index({ workspace: 1, status: 1 });
intakeFormSchema.index({ workspace: 1, requestedBy: 1 });
module.exports = mongoose.model('IntakeForm', intakeFormSchema);
`;

// 25. MOM
models['MOM.js'] = `const mongoose = require('mongoose');
const momSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  momNumber: { type: String, unique: true },
  docNumber: { type: String, default: "IMS-01-04-L4-04" },
  title: String,
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  meeting: { type: mongoose.Schema.Types.ObjectId, ref: "Meeting" },
  meetingDate: Date, location: String, agenda: String,
  attendees: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, name: String, department: String, designation: String, email: String, signatureRequired: Boolean, signed: Boolean, signedAt: Date }],
  status: { type: String, enum: ["draft", "sent_for_signature", "partially_signed", "signed", "closed"], default: "draft" },
  pdfFilePath: String, pdfFileUrl: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
momSchema.index({ workspace: 1, momNumber: 1 }, { unique: true });
momSchema.index({ workspace: 1, task: 1 });
momSchema.index({ workspace: 1, project: 1 });
module.exports = mongoose.model('MOM', momSchema);
`;

// 26. MOMPoint
models['MOMPoint.js'] = `const mongoose = require('mongoose');
const momPointSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  mom: { type: mongoose.Schema.Types.ObjectId, ref: "MOM" },
  pointNumber: Number, discussionPoint: String, decisionTaken: String,
  responsiblePerson: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  targetClosureDate: Date, actualClosureDate: Date,
  status: { type: String, enum: ["open", "in_progress", "closed", "overdue"], default: "open" },
  remarks: String
}, { timestamps: true });
module.exports = mongoose.model('MOMPoint', momPointSchema);
`;

// 27. MOMSignature
models['MOMSignature.js'] = `const mongoose = require('mongoose');
const momSignatureSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  mom: { type: mongoose.Schema.Types.ObjectId, ref: "MOM" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String, designation: String, department: String,
  signatureText: String, signatureImage: String,
  ipAddress: String, userAgent: String, signedAt: Date,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('MOMSignature', momSignatureSchema);
`;

// 28. Meeting
models['Meeting.js'] = `const mongoose = require('mongoose');
const meetingSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  meetingNumber: { type: String, unique: true },
  title: String, description: String, agenda: String,
  meetingType: { type: String, enum: ["internal", "client", "vendor", "kickoff", "review", "other"], default: "internal" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  startDateTime: Date, endDateTime: Date, durationMinutes: Number,
  locationType: { type: String, enum: ["physical", "zoom", "google_meet", "manual_link"], default: "physical" },
  location: String, meetingLink: String, zoomMeetingId: String, zoomPassword: String, googleMeetLink: String,
  attendees: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, name: String, email: String, status: { type: String, enum: ["pending", "accepted", "declined", "tentative"], default: "pending" } }],
  reminders: [{ minutesBefore: Number, sent: Boolean, sentAt: Date }],
  calendarEvent: { type: mongoose.Schema.Types.ObjectId, ref: "CalendarEvent" },
  mom: { type: mongoose.Schema.Types.ObjectId, ref: "MOM" },
  status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
meetingSchema.index({ workspace: 1, meetingNumber: 1 }, { unique: true });
meetingSchema.index({ workspace: 1, startDateTime: 1 });
module.exports = mongoose.model('Meeting', meetingSchema);
`;

// 29. CalendarEvent
models['CalendarEvent.js'] = `const mongoose = require('mongoose');
const calendarEventSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  title: String, description: String,
  eventType: { type: String, enum: ["task", "meeting", "mom", "sla", "budget", "holiday", "reminder", "custom"] },
  startDate: Date, endDate: Date, allDay: Boolean, color: String,
  refModel: { type: String, enum: ["Task", "Meeting", "MOM", "SLATracker", "Budget", "Expense", "Holiday", null] },
  refId: mongoose.Schema.Types.ObjectId,
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  isRecurring: Boolean,
  recurrenceRule: { frequency: { type: String, enum: ["daily", "weekly", "monthly", "yearly"] }, interval: Number, daysOfWeek: [String], endDate: Date },
  reminders: [{ minutesBefore: Number, sent: Boolean }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
calendarEventSchema.index({ workspace: 1, startDate: 1 });
calendarEventSchema.index({ workspace: 1, endDate: 1 });
calendarEventSchema.index({ workspace: 1, eventType: 1 });
calendarEventSchema.index({ workspace: 1, assignedTo: 1 });
module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
`;

// 30. Holiday
models['Holiday.js'] = `const mongoose = require('mongoose');
const holidaySchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String, date: Date,
  type: { type: String, enum: ["public", "company", "optional"], default: "company" },
  isRecurringYearly: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
module.exports = mongoose.model('Holiday', holidaySchema);
`;

for (const [filename, content] of Object.entries(models)) {
  fs.writeFileSync(path.join(__dirname, '../models', filename), content);
}
console.log('Batch 2 models generated.');
