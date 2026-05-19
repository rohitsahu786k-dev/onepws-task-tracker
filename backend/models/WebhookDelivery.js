const mongoose = require('mongoose');

const { Schema } = mongoose;

const WebhookDeliverySchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    webhook: { type: Schema.Types.ObjectId, ref: 'Webhook', required: true },
    event: { type: String, required: true },
    eventId: { type: String, required: true },
    payload: { type: Object, default: {} },
    url: String,
    requestHeaders: Object,
    responseStatus: Number,
    responseBody: String,
    responseHeaders: Object,
    responseTimeMs: Number,
    status: {
      type: String,
      enum: [
        'pending',
        'success',
        'failed',
        'retry_scheduled',
        'retrying',
        'cancelled',
      ],
      default: 'pending',
    },
    attempt: { type: Number, default: 1 },
    maxAttempts: { type: Number, default: 3 },
    nextRetryAt: Date,
    errorCode: String,
    errorMessage: String,
    deliveredAt: Date,
  },
  { timestamps: true }
);

WebhookDeliverySchema.index({ workspace: 1, webhook: 1, createdAt: -1 });
WebhookDeliverySchema.index({ workspace: 1, event: 1 });
WebhookDeliverySchema.index({ workspace: 1, status: 1 });
WebhookDeliverySchema.index({ workspace: 1, nextRetryAt: 1 });
WebhookDeliverySchema.index({ eventId: 1 });

module.exports =
  mongoose.models.WebhookDelivery ||
  mongoose.model('WebhookDelivery', WebhookDeliverySchema);
