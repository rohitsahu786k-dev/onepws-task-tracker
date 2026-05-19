const mongoose = require('mongoose');

const { Schema } = mongoose;

const APIKeyUsageLogSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    apiKey: { type: Schema.Types.ObjectId, ref: 'APIKey', required: true },
    keyPrefix: String,
    method: String,
    path: String,
    statusCode: Number,
    responseTimeMs: Number,
    ipAddress: String,
    userAgent: String,
    requestId: String,
    errorCode: String,
    errorMessage: String,
  },
  { timestamps: true }
);

APIKeyUsageLogSchema.index({ workspace: 1, apiKey: 1, createdAt: -1 });
APIKeyUsageLogSchema.index({ workspace: 1, keyPrefix: 1, createdAt: -1 });
APIKeyUsageLogSchema.index({ workspace: 1, statusCode: 1 });
APIKeyUsageLogSchema.index({ workspace: 1, ipAddress: 1 });
APIKeyUsageLogSchema.index({ requestId: 1 });

module.exports =
  mongoose.models.APIKeyUsageLog ||
  mongoose.model('APIKeyUsageLog', APIKeyUsageLogSchema);
