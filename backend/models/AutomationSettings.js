const mongoose = require('mongoose');

const { Schema } = mongoose;

const automationSettingsSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, unique: true },
    enabled: { type: Boolean, default: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    tasks: { type: Schema.Types.Mixed, default: {} },
    sla: { type: Schema.Types.Mixed, default: {} },
    meetings: { type: Schema.Types.Mixed, default: {} },
    mom: { type: Schema.Types.Mixed, default: {} },
    reports: { type: Schema.Types.Mixed, default: {} },
    backup: { type: Schema.Types.Mixed, default: {} },
    mediaCleanup: { type: Schema.Types.Mixed, default: {} },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.AutomationSettings || mongoose.model('AutomationSettings', automationSettingsSchema);
