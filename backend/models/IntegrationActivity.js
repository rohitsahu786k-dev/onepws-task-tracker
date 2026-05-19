const mongoose = require('mongoose');

const { Schema } = mongoose;

const IntegrationActivitySchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace' },
    module: {
      type: String,
      enum: ['api_keys', 'webhooks', 'external_api'],
    },
    action: String,
    refModel: String,
    refId: { type: Schema.Types.ObjectId },
    description: String,
    metadata: { type: Object, default: {} },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

IntegrationActivitySchema.index({ workspace: 1, createdAt: -1 });
IntegrationActivitySchema.index({ workspace: 1, module: 1, createdAt: -1 });
IntegrationActivitySchema.index({ workspace: 1, refModel: 1, refId: 1 });
IntegrationActivitySchema.index({ workspace: 1, performedBy: 1 });

module.exports =
  mongoose.models.IntegrationActivity ||
  mongoose.model('IntegrationActivity', IntegrationActivitySchema);
