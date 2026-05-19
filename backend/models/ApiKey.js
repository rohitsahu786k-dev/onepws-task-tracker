const mongoose = require('mongoose');

const { Schema } = mongoose;

const APIKeySchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true, trim: true },
    description: String,
    keyPrefix: { type: String, required: true },
    keyHash: { type: String, required: true },
    environment: { type: String, enum: ['live', 'test'], default: 'live' },
    permissions: [{ type: String }],
    allowedIps: [{ type: String }],
    rateLimit: {
      enabled: { type: Boolean, default: true },
      requestsPerMinute: { type: Number, default: 60 },
      requestsPerHour: { type: Number, default: 1000 },
      requestsPerDay: { type: Number, default: 10000 },
    },
    expiresAt: Date,
    lastUsedAt: Date,
    lastUsedIp: String,
    usageCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'revoked', 'expired', 'disabled'],
      default: 'active',
    },
    revokedAt: Date,
    revokedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    revokeReason: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

APIKeySchema.index({ keyHash: 1 }, { unique: true });
APIKeySchema.index({ workspace: 1, keyPrefix: 1 });
APIKeySchema.index({ workspace: 1, status: 1 });
APIKeySchema.index({ workspace: 1, expiresAt: 1 });
APIKeySchema.index({ workspace: 1, createdBy: 1 });

module.exports = mongoose.models.APIKey || mongoose.model('APIKey', APIKeySchema);
