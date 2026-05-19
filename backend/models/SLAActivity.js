const mongoose = require('mongoose');

const { Schema } = mongoose;

const slaActivitySchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    module: { type: String, default: 'sla' },
    action: { type: String, required: true },
    refModel: String,
    refId: Schema.Types.ObjectId,
    description: String,
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

slaActivitySchema.index({ workspace: 1, refModel: 1, refId: 1, createdAt: -1 });

module.exports = mongoose.models.SLAActivity || mongoose.model('SLAActivity', slaActivitySchema);
