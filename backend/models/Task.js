const mongoose = require('mongoose');

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const taskTypes = [
  'catalogue',
  'brochure',
  'flyer',
  'social_media_post',
  'ppt',
  'website_update',
  'event',
  'email_campaign',
  'print_file',
  'design',
  'content',
  'revision',
  'approval',
  'other',
];

const deliverableTypes = [
  'catalogue_upto_20_pages',
  'catalogue_20_40_pages',
  'catalogue_40_plus_pages',
  'brochure',
  'flyer',
  'social_media_post',
  'ppt_less_20_pages',
  'ppt_more_20_pages',
  'website_update',
  'events',
  'event_collateral',
  'email_campaign',
  'print_file',
  'video',
  'other',
  // Legacy values used by the current UI/imports.
  'CAT-S',
  'CAT-M',
  'CAT-L',
  'BROCHURE',
  'FLYER',
  'SOCIAL',
  'PPT-S',
  'PPT-L',
  'EMAIL',
  'EVENT',
  'WEB',
  'OTHER',
];

const taskStatuses = [
  'draft',
  'open',
  'in_progress',
  'in_review',
  'waiting_for_input',
  'waiting_for_feedback',
  'on_hold',
  'submitted',
  'closed',
  'cancelled',
  'reopened',
  // Legacy statuses kept for backwards compatibility.
  'in_process',
  'review',
  'hold',
];

const checklistItemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    isCompleted: { type: Boolean, default: false },
    completedBy: { type: ObjectId, ref: 'User' },
    completedAt: Date,
    order: Number,
  },
  { _id: true }
);

const dependencySchema = new Schema(
  {
    task: { type: ObjectId, ref: 'Task', required: true },
    type: { type: String, enum: ['blocks', 'blocked_by', 'related'], default: 'blocked_by' },
  },
  { _id: true }
);

const attachmentSchema = new Schema(
  {
    mediaFile: { type: ObjectId, ref: 'MediaFile' },
    fileName: String,
    uploadedBy: { type: ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const approverSchema = new Schema(
  {
    user: { type: ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    comment: String,
    respondedAt: Date,
  },
  { _id: true }
);

const taskSchema = new Schema(
  {
    workspace: { type: ObjectId, ref: 'Workspace', required: true },
    taskNumber: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: String,

    taskType: { type: String, enum: taskTypes, default: 'other' },
    taskCategory: String,
    deliverableType: { type: String, enum: deliverableTypes },
    requestType: {
      type: String,
      enum: ['new_work', 'rework', 'revision', 'urgent', 'campaign', 'event'],
      default: 'new_work',
    },
    sourceModule: {
      type: String,
      enum: ['manual', 'tracker', 'intake', 'project', 'mom', 'meeting', 'sla', 'recurring', 'import'],
      default: 'manual',
    },
    sourceRef: {
      refModel: String,
      refId: { type: ObjectId },
    },

    project: { type: ObjectId, ref: 'Project' },
    trackerRow: { type: ObjectId, ref: 'TrackerRow' },
    intakeForm: { type: ObjectId, ref: 'IntakeForm' },
    slaTracker: { type: ObjectId, ref: 'SLATracker' },
    parentTask: { type: ObjectId, ref: 'Task' },
    subtasks: [{ type: ObjectId, ref: 'Task' }],

    requestedBy: { type: ObjectId, ref: 'User' },
    requestedByDepartment: { type: ObjectId, ref: 'Department' },
    assignedTo: [{ type: ObjectId, ref: 'User' }],
    assignedBy: { type: ObjectId, ref: 'User' },
    handledBy: { type: ObjectId, ref: 'User' },
    watchers: [{ type: ObjectId, ref: 'User' }],
    department: { type: ObjectId, ref: 'Department' },

    stage: { type: ObjectId, ref: 'TaskStage' },
    status: { type: String, enum: taskStatuses, default: 'open' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },

    revisionNumber: { type: String, default: 'R0' },
    revisionCount: { type: Number, default: 0 },

    startDate: Date,
    dueDate: Date,
    targetDueDate: Date,
    actualClosingDate: Date,
    submittedAt: Date,
    closedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    holdReason: String,
    holdStartDate: Date,

    delayDays: { type: Number, default: 0 },
    delayInDays: Number,
    delayStatus: {
      type: String,
      enum: ['pending', 'on_time', 'early', 'delayed', 'overdue', 'closed_due_to_no_feedback'],
      default: 'pending',
    },
    isOverdue: { type: Boolean, default: false },

    estimatedHours: Number,
    actualHours: { type: Number, default: 0 },
    loggedHours: Number,
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },

    checklist: [checklistItemSchema],
    dependencies: [dependencySchema],
    attachments: [attachmentSchema],

    approval: {
      required: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ['not_required', 'pending', 'approved', 'rejected'],
        default: 'not_required',
      },
      approvers: [approverSchema],
    },

    feedback: {
      required: { type: Boolean, default: false },
      requestedAt: Date,
      dueAt: Date,
      receivedAt: Date,
      status: {
        type: String,
        enum: ['not_required', 'pending', 'received', 'overdue', 'none', 'requested'],
        default: 'not_required',
      },
      delayDays: Number,
    },

    tags: [String],
    customFields: { type: Map, of: Schema.Types.Mixed },
    visibility: {
      type: String,
      enum: ['workspace', 'department', 'assignees_only', 'private'],
      default: 'workspace',
    },
    calendarEvent: { type: ObjectId, ref: 'CalendarEvent' },

    isRecurring: { type: Boolean, default: false },
    recurringRule: {
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
      interval: Number,
      nextRunAt: Date,
      endDate: Date,
    },

    isLocked: { type: Boolean, default: false },
    lockedAt: Date,
    lockedBy: { type: ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: ObjectId, ref: 'User' },

    finalStatus: { type: String, enum: ['pending', 'submitted', 'closed'], default: 'pending' },
    taskProvidedBy: String,
    taskGivenByDepartmentText: String,
    productType: { type: String, enum: ['CD', 'CCR', 'MOT', 'FLOOR', 'Other'] },
    receiptDate: Date,
    finalInputReceiptDate: Date,
    remarkIfPending: String,
    publicShare: { enabled: Boolean, token: String, expiresAt: Date },

    createdBy: { type: ObjectId, ref: 'User' },
    updatedBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

taskSchema.pre('validate', function normalizeLegacyFields(next) {
  if (!this.taskNumber) return next();
  if (!this.targetDueDate && this.dueDate) this.targetDueDate = this.dueDate;
  if (this.actualHours && !this.loggedHours) this.loggedHours = this.actualHours;
  if (this.delayDays && !this.delayInDays) this.delayInDays = this.delayDays;
  next();
});

taskSchema.index({ workspace: 1, taskNumber: 1 }, { unique: true });
taskSchema.index({ workspace: 1, status: 1 });
taskSchema.index({ workspace: 1, stage: 1 });
taskSchema.index({ workspace: 1, priority: 1 });
taskSchema.index({ workspace: 1, assignedTo: 1 });
taskSchema.index({ workspace: 1, requestedByDepartment: 1 });
taskSchema.index({ workspace: 1, project: 1 });
taskSchema.index({ workspace: 1, dueDate: 1 });
taskSchema.index({ workspace: 1, isOverdue: 1 });
taskSchema.index({ workspace: 1, createdAt: -1 });
taskSchema.index({ workspace: 1, sourceModule: 1 });
taskSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.models.Task || mongoose.model('Task', taskSchema);
