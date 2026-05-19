const mongoose = require('mongoose');

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const momTypes = [
  'kickoff',
  'project_review',
  'design_review',
  'client_discussion',
  'budget_review',
  'sla_review',
  'internal',
  'vendor',
  'general',
];

const attendeeSchema = new Schema(
  {
    user: { type: ObjectId, ref: 'User' },
    name: String,
    email: String,
    department: { type: ObjectId, ref: 'Department' },
    departmentText: String,
    designation: String,
    attendeeType: { type: String, enum: ['internal', 'external'], default: 'internal' },
    attendanceStatus: { type: String, enum: ['present', 'absent', 'optional'], default: 'present' },
    signatureRequired: { type: Boolean, default: true },
    signed: { type: Boolean, default: false },
    signedAt: Date,
    signatureText: String,
    signatureIpAddress: String,
    signatureUserAgent: String,
    externalSignatureToken: String,
    externalSignatureExpiresAt: Date,
  },
  { _id: true }
);

const actionPointSchema = new Schema(
  {
    pointNumber: Number,
    title: { type: String, required: true, trim: true },
    description: String,
    responsiblePerson: { type: ObjectId, ref: 'User' },
    responsibleDepartment: { type: ObjectId, ref: 'Department' },
    targetDate: Date,
    targetClosureDate: Date,
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['open', 'in_progress', 'completed', 'overdue', 'cancelled', 'closed'], default: 'open' },
    linkedTask: { type: ObjectId, ref: 'Task' },
    calendarEvent: { type: ObjectId, ref: 'CalendarEvent' },
    completedAt: Date,
    completedBy: { type: ObjectId, ref: 'User' },
    remarks: String,
  },
  { _id: true }
);

const momSchema = new Schema(
  {
    workspace: { type: ObjectId, ref: 'Workspace', required: true },
    momNumber: { type: String, required: true },
    docNumber: { type: String, default: 'IMS-01-04-L4-04' },
    title: { type: String, required: true, trim: true },
    description: String,
    momType: { type: String, enum: momTypes, default: 'general' },
    meeting: { type: ObjectId, ref: 'Meeting' },
    project: { type: ObjectId, ref: 'Project' },
    task: { type: ObjectId, ref: 'Task' },
    intakeForm: { type: ObjectId, ref: 'IntakeForm' },
    slaTracker: { type: ObjectId, ref: 'SLATracker' },
    meetingDate: { type: Date, required: true },
    startTime: String,
    endTime: String,
    location: String,
    meetingLink: String,
    agenda: String,
    attendees: [attendeeSchema],
    discussionPoints: [{ title: String, description: String, order: Number }],
    decisions: [{ decision: String, decidedBy: { type: ObjectId, ref: 'User' }, decisionDate: Date, order: Number }],
    actionPoints: [actionPointSchema],
    attachments: [
      {
        mediaFile: { type: ObjectId, ref: 'MediaFile' },
        fileName: String,
        uploadedBy: { type: ObjectId, ref: 'User' },
        uploadedAt: Date,
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'sent_for_signature', 'partially_signed', 'signed', 'completed', 'cancelled', 'archived', 'closed'],
      default: 'draft',
    },
    signatureSummary: {
      requiredCount: { type: Number, default: 0 },
      signedCount: { type: Number, default: 0 },
      pendingCount: { type: Number, default: 0 },
    },
    pdfFile: {
      mediaFile: { type: ObjectId, ref: 'MediaFile' },
      filePath: String,
      fileUrl: String,
      generatedAt: Date,
      generatedBy: { type: ObjectId, ref: 'User' },
    },
    pdfFilePath: String,
    pdfFileUrl: String,
    sentAt: Date,
    sentBy: { type: ObjectId, ref: 'User' },
    completedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    visibility: { type: String, enum: ['workspace', 'department', 'attendees_only', 'private'], default: 'attendees_only' },
    isLocked: { type: Boolean, default: false },
    lockedAt: Date,
    lockedBy: { type: ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: ObjectId, ref: 'User' },
    createdBy: { type: ObjectId, ref: 'User' },
    updatedBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

momSchema.pre('validate', function normalizeMOM(next) {
  for (const attendee of this.attendees || []) {
    if (typeof attendee.department === 'string' && !mongoose.Types.ObjectId.isValid(attendee.department)) {
      attendee.departmentText = attendee.department;
      attendee.department = undefined;
    }
    if (attendee.signatureRequired === undefined) attendee.signatureRequired = true;
  }
  for (const [index, point] of (this.actionPoints || []).entries()) {
    if (!point.pointNumber) point.pointNumber = index + 1;
    if (!point.targetDate && point.targetClosureDate) point.targetDate = point.targetClosureDate;
    if (!point.targetClosureDate && point.targetDate) point.targetClosureDate = point.targetDate;
    if (point.status === 'closed') point.status = 'completed';
  }
  const required = (this.attendees || []).filter((a) => a.signatureRequired !== false);
  const signed = required.filter((a) => a.signed);
  this.signatureSummary = {
    requiredCount: required.length,
    signedCount: signed.length,
    pendingCount: Math.max(required.length - signed.length, 0),
  };
  if (this.pdfFile?.filePath && !this.pdfFilePath) this.pdfFilePath = this.pdfFile.filePath;
  if (this.pdfFile?.fileUrl && !this.pdfFileUrl) this.pdfFileUrl = this.pdfFile.fileUrl;
  next();
});

momSchema.index({ workspace: 1, momNumber: 1 }, { unique: true });
momSchema.index({ workspace: 1, status: 1 });
momSchema.index({ workspace: 1, momType: 1 });
momSchema.index({ workspace: 1, meetingDate: -1 });
momSchema.index({ workspace: 1, project: 1 });
momSchema.index({ workspace: 1, task: 1 });
momSchema.index({ workspace: 1, meeting: 1 });
momSchema.index({ workspace: 1, createdBy: 1 });
momSchema.index({ workspace: 1, 'attendees.user': 1 });
momSchema.index({ workspace: 1, 'actionPoints.responsiblePerson': 1 });
momSchema.index({ workspace: 1, 'actionPoints.targetDate': 1 });

module.exports = mongoose.models.MOM || mongoose.model('MOM', momSchema);
