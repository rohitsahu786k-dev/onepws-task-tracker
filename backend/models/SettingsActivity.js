const mongoose = require('mongoose');

const { Schema } = mongoose;

const settingsActivitySchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace' },
    category: String,
    settingKey: String,
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    ipAddress: String,
    userAgent: String,
    reason: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

settingsActivitySchema.index({ workspace: 1, category: 1, createdAt: -1 });
settingsActivitySchema.index({ workspace: 1, changedBy: 1 });

module.exports = mongoose.models.SettingsActivity || mongoose.model('SettingsActivity', settingsActivitySchema);
