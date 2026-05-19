const mongoose = require('mongoose');

const { Schema } = mongoose;

const moduleSettingsSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    moduleKey: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    settings: { type: Schema.Types.Mixed, default: {} },
    dependencies: [String],
    visibleToRoles: [String],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

moduleSettingsSchema.index({ workspace: 1, moduleKey: 1 }, { unique: true });

module.exports = mongoose.models.ModuleSettings || mongoose.model('ModuleSettings', moduleSettingsSchema);
