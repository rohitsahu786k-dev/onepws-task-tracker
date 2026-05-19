const mongoose = require('mongoose');

const channelPreferenceSchema = new mongoose.Schema(
  {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    slack: { type: Boolean, default: false },
    telegram: { type: Boolean, default: false }
  },
  { _id: false }
);

const notificationPreferenceSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  preferences: {
    type: Map,
    of: channelPreferenceSchema,
    default: {}
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
