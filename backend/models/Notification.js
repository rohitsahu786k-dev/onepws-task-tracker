const mongoose = require('mongoose');

const NOTIFICATION_EVENTS = [
  'task_assigned',
  'task_updated',
  'task_stage_changed',
  'task_commented',
  'task_overdue',
  'task_due_today',
  'task_due_tomorrow',
  'mention',
  'task_mentioned',
  'task_created',
  'task_completed',
  'task_reopened',
  'project_assigned',
  'project_status_changed',
  'workspace_invited',
  'user_joined_workspace',
  'mom_created',
  'mom_sent_for_signature',
  'mom_signed',
  'mom_pending_signature',
  'mom_point_due',
  'mom_point_overdue',
  'meeting_scheduled',
  'meeting_updated',
  'meeting_rescheduled',
  'meeting_cancelled',
  'meeting_reminder',
  'meeting_completed',
  'meeting_attendee_responded',
  'mom_required_after_meeting',
  'deadline_approaching',
  'sla_phase_due',
  'sla_phase_overdue',
  'sla_breach',
  'sla_escalation',
  'sla_t0_reset',
  'budget_submitted',
  'budget_approved',
  'budget_rejected',
  'budget_over_budget',
  'expense_submitted',
  'expense_approved',
  'expense_rejected',
  'expense_payment_due',
  'tracker_row_created',
  'tracker_row_assigned',
  'tracker_row_updated',
  'tracker_task_delayed',
  'tracker_row_submitted',
  'tracker_row_locked',
  'tracker_import_completed',
  'intake_submitted',
  'intake_approved',
  'intake_rejected',
  't0_confirmed',
  'calendar_event_created',
  'calendar_event_reminder',
  'announcement',
  'announcement_created',
  'daily_digest',
  'system',
  'system_backup_completed',
  'system_backup_failed',
  'security_failed_login'
];

const channelStatusSchema = new mongoose.Schema(
  {
    sent: { type: Boolean, default: false },
    sentAt: Date,
    error: String
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: NOTIFICATION_EVENTS, required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    shortMessage: String,
    refModel: String,
    refId: { type: mongoose.Schema.Types.ObjectId },
    actionUrl: String,
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      slack: { type: Boolean, default: false },
      telegram: { type: Boolean, default: false }
    },
    deliveryStatus: {
      inApp: { type: channelStatusSchema, default: () => ({}) },
      email: { type: channelStatusSchema, default: () => ({}) },
      slack: { type: channelStatusSchema, default: () => ({}) },
      telegram: { type: channelStatusSchema, default: () => ({}) }
    },
    isRead: { type: Boolean, default: false },
    readAt: Date,
    isArchived: { type: Boolean, default: false },
    archivedAt: Date,
    metadata: {
      taskNumber: String,
      taskTitle: String,
      projectName: String,
      departmentName: String,
      dueDate: Date,
      delayDays: Number,
      amount: Number,
      meetingDate: Date,
      meetingLink: String,
      momNumber: String,
      momTitle: String,
      slaPhase: String,
      escalationLevel: String
    }
  },
  { timestamps: true }
);

schema.index({ recipient: 1, isRead: 1, createdAt: -1 });
schema.index({ workspace: 1, createdAt: -1 });
schema.index({ workspace: 1, type: 1 });
schema.index({ refModel: 1, refId: 1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', schema);
module.exports.NOTIFICATION_EVENTS = NOTIFICATION_EVENTS;
