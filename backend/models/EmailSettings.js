const mongoose = require('mongoose');

const { Schema } = mongoose;

const emailSettingsSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, unique: true },
    enabled: { type: Boolean, default: true },
    provider: { type: String, enum: ['smtp', 'brevo', 'sendgrid', 'mailgun', 'none'], default: 'smtp' },
    smtp: {
      host: String,
      port: Number,
      secure: Boolean,
      username: String,
      passwordEncrypted: String,
      fromEmail: String,
      fromName: String,
      replyTo: String,
    },
    brevo: { apiKeyEncrypted: String, senderEmail: String, senderName: String },
    sendgrid: { apiKeyEncrypted: String, senderEmail: String, senderName: String },
    templates: {
      useWorkspaceBranding: { type: Boolean, default: true },
      footerText: String,
      supportEmail: String,
    },
    lastTestAt: Date,
    lastTestStatus: { type: String, enum: ['success', 'failed', 'not_tested'], default: 'not_tested' },
    lastTestError: String,
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.EmailSettings || mongoose.model('EmailSettings', emailSettingsSchema);
