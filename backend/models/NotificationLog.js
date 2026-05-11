const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  notification: { type: mongoose.Schema.Types.ObjectId, ref: "Notification" },
  channel: { type: String, enum: ["in_app", "email", "slack", "telegram"] },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  recipientEmail: String,
  status: { type: String, enum: ["pending", "sent", "failed", "skipped"], default: "pending" },
  providerResponse: mongoose.Schema.Types.Mixed,
  errorMessage: String,
  retryCount: { type: Number, default: 0 },
  sentAt: Date
}, { timestamps: true });

notificationLogSchema.index({ notification: 1 });
notificationLogSchema.index({ status: 1 });
notificationLogSchema.index({ channel: 1 });
notificationLogSchema.index({ createdAt: 1 });

module.exports = mongoose.models.NotificationLog || mongoose.model('NotificationLog', notificationLogSchema);
