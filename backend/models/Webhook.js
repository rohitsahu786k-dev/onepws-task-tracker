const mongoose = require('mongoose');

const { Schema } = mongoose;

const WebhookSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true, trim: true },
    description: String,
    url: { type: String, required: true },
    secretEncrypted: { type: String, required: true },
    events: [{ type: String, required: true }],
    status: {
      type: String,
      enum: ['active', 'disabled', 'failed', 'paused'],
      default: 'active',
    },
    headers: [
      {
        key: String,
        valueEncrypted: String,
      },
    ],
    retryPolicy: {
      enabled: { type: Boolean, default: true },
      maxRetries: { type: Number, default: 3 },
      retryIntervalsMinutes: { type: [Number], default: [1, 5, 15] },
    },
    timeoutSeconds: { type: Number, default: 10 },
    lastTriggeredAt: Date,
    lastSuccessAt: Date,
    lastFailureAt: Date,
    failureCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    isSystemWebhook: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

WebhookSchema.index({ workspace: 1, status: 1 });
WebhookSchema.index({ workspace: 1, events: 1 });
WebhookSchema.index({ workspace: 1, createdBy: 1 });
WebhookSchema.index({ workspace: 1, lastFailureAt: 1 });

module.exports =
  mongoose.models.Webhook || mongoose.model('Webhook', WebhookSchema);
