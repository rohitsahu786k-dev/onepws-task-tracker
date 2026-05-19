const mongoose = require('mongoose');

const { Schema } = mongoose;

const integrationSettingsSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, unique: true },
    google: { type: Schema.Types.Mixed, default: {} },
    zoom: { type: Schema.Types.Mixed, default: {} },
    slack: { type: Schema.Types.Mixed, default: {} },
    telegram: { type: Schema.Types.Mixed, default: {} },
    openai: { type: Schema.Types.Mixed, default: {} },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.IntegrationSettings || mongoose.model('IntegrationSettings', integrationSettingsSchema);
