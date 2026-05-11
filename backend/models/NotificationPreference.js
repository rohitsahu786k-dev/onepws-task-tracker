const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  preferences: {
    task_assigned: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true }, slack: { type: Boolean, default: false }, telegram: { type: Boolean, default: false } },
    task_overdue: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true }, slack: { type: Boolean, default: false }, telegram: { type: Boolean, default: false } },
    task_commented: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
    mention: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
    mom_created: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
    mom_signed: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
    meeting_scheduled: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
    meeting_reminder: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
    sla_breach: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true }, slack: { type: Boolean, default: false }, telegram: { type: Boolean, default: false } },
    budget_approved: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
    expense_approved: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
    daily_digest: { email: { type: Boolean, default: true } }
  },
  mutedUntil: Date,
  quietHours: {
    enabled: { type: Boolean, default: false },
    startTime: String,
    endTime: String
  }
}, { timestamps: true });

notificationPreferenceSchema.index({ workspace: 1, user: 1 }, { unique: true });

module.exports = mongoose.models.NotificationPreference || mongoose.model('NotificationPreference', notificationPreferenceSchema);
