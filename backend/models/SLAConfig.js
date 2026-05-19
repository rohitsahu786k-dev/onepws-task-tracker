const mongoose = require('mongoose');

const { Schema } = mongoose;

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
  'event_collateral',
  'email_campaign',
  'print_file',
  'video',
  'other',
  // Legacy values.
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
];

const slaConfigSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true, trim: true },
    title: String,
    deliverableType: { type: String, enum: deliverableTypes, required: true },
    requestType: {
      type: String,
      enum: ['new_work', 'rework', 'revision', 'urgent', 'campaign', 'event'],
      default: 'new_work',
    },
    description: String,
    totalWorkingDays: { type: Number, required: true },
    newWorkTotalDays: Number,
    reworkTotalDays: Number,
    phases: [
      {
        phaseKey: { type: String, required: true },
        phaseName: { type: String, required: true },
        order: Number,
        durationWorkingDays: { type: Number, required: true, default: 0 },
        newWorkDays: Number,
        reworkDays: Number,
        startsAfterPhase: String,
        responsibleRole: {
          type: String,
          enum: ['marketing', 'requester', 'designer', 'content', 'manager', 'approver', 'vendor', 'system'],
          default: 'marketing',
        },
        requiresApproval: { type: Boolean, default: false },
        requiresFeedback: { type: Boolean, default: false },
        autoCreateCalendarEvent: { type: Boolean, default: true },
      },
    ],
    feedbackRules: {
      feedbackDueWorkingDays: { type: Number, default: 2 },
      autoHoldAfterWorkingDays: { type: Number, default: 2 },
      autoCloseAfterWorkingDays: { type: Number, default: 5 },
      allowT0ResetAfterChangePercent: { type: Number, default: 30 },
    },
    rules: {
      dayZeroStartsAfterCompleteInput: Boolean,
      kickoffMeetingRequired: Boolean,
      momRequiredBeforeStart: Boolean,
      maxDraftCycles: Number,
      feedbackWithinWorkingDays: Number,
      autoHoldAfterNoFeedbackDays: Number,
      autoCloseAfterNoFeedbackDays: Number,
      changeAboveThirtyPercentResetT0: Boolean,
    },
    escalationRules: [
      {
        level: Number,
        afterDelayWorkingDays: Number,
        notifyRoles: [
          {
            type: String,
            enum: ['assignee', 'project_manager', 'department_head', 'admin', 'top_management'],
          },
        ],
        channels: {
          inApp: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
          slack: { type: Boolean, default: false },
          telegram: { type: Boolean, default: false },
        },
        requireCAPA: { type: Boolean, default: false },
      },
    ],
    escalationMatrix: [
      {
        delayDays: Number,
        escalateToRole: String,
        escalateToUser: { type: Schema.Types.ObjectId, ref: 'User' },
        action: String,
      },
    ],
    workingDayPolicy: {
      excludeWeekends: { type: Boolean, default: true },
      excludeHolidays: { type: Boolean, default: true },
      useWorkspaceWorkingDays: { type: Boolean, default: true },
    },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

slaConfigSchema.pre('validate', function normalizeConfig(next) {
  if (!this.name && this.title) this.name = this.title;
  if (!this.title && this.name) this.title = this.name;
  if (!this.totalWorkingDays) {
    this.totalWorkingDays = this.requestType === 'rework' ? this.reworkTotalDays : this.newWorkTotalDays;
  }
  if (this.rules) {
    if (this.rules.feedbackWithinWorkingDays && !this.feedbackRules.feedbackDueWorkingDays) {
      this.feedbackRules.feedbackDueWorkingDays = this.rules.feedbackWithinWorkingDays;
    }
    if (this.rules.autoHoldAfterNoFeedbackDays) {
      this.feedbackRules.autoHoldAfterWorkingDays = this.rules.autoHoldAfterNoFeedbackDays;
    }
    if (this.rules.autoCloseAfterNoFeedbackDays) {
      this.feedbackRules.autoCloseAfterWorkingDays = this.rules.autoCloseAfterNoFeedbackDays;
    }
  }
  for (const phase of this.phases || []) {
    if (!phase.durationWorkingDays) {
      phase.durationWorkingDays = this.requestType === 'rework' ? phase.reworkDays || 0 : phase.newWorkDays || 0;
    }
  }
  next();
});

slaConfigSchema.index({ workspace: 1, deliverableType: 1, requestType: 1 });
slaConfigSchema.index({ workspace: 1, isActive: 1 });
slaConfigSchema.index({ workspace: 1, isDefault: 1 });

module.exports = mongoose.models.SLAConfig || mongoose.model('SLAConfig', slaConfigSchema);
