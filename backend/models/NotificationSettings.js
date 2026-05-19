const mongoose = require('mongoose');

const { Schema } = mongoose;

const notificationSettingsSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, unique: true },
    inApp: { enabled: { type: Boolean, default: true }, socketEnabled: { type: Boolean, default: true }, showToast: { type: Boolean, default: true }, playSound: { type: Boolean, default: false } },
    email: { enabled: { type: Boolean, default: true }, dailyDigest: { type: Boolean, default: true }, weeklySummary: { type: Boolean, default: true } },
    slack: { enabled: { type: Boolean, default: false }, webhookUrlEncrypted: String, channelName: String },
    telegram: { enabled: { type: Boolean, default: false }, botTokenEncrypted: String, chatId: String },
    eventRules: { type: Schema.Types.Mixed, default: {} },
    quietHours: { enabled: { type: Boolean, default: false }, start: String, end: String },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.NotificationSettings || mongoose.model('NotificationSettings', notificationSettingsSchema);
