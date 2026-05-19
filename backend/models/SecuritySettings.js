const mongoose = require('mongoose');

const { Schema } = mongoose;

const securitySettingsSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, unique: true },
    passwordPolicy: {
      minLength: { type: Number, default: 8 },
      requireUppercase: { type: Boolean, default: true },
      requireLowercase: { type: Boolean, default: true },
      requireNumber: { type: Boolean, default: true },
      requireSpecialChar: { type: Boolean, default: true },
      passwordExpiryDays: { type: Number, default: 0 },
    },
    loginSecurity: {
      maxFailedAttempts: { type: Number, default: 5 },
      lockMinutes: { type: Number, default: 30 },
      enableTwoFactorForAdmins: { type: Boolean, default: false },
      allowGoogleLogin: { type: Boolean, default: true },
      allowPasswordLogin: { type: Boolean, default: true },
    },
    session: {
      accessTokenExpiry: { type: String, default: '15m' },
      refreshTokenExpiryDays: { type: Number, default: 7 },
      rememberMeExpiryDays: { type: Number, default: 30 },
      maxActiveSessions: { type: Number, default: 5 },
      forceLogoutOnPasswordChange: { type: Boolean, default: true },
    },
    ipWhitelist: { enabled: { type: Boolean, default: false }, allowedIps: [String] },
    fileSecurity: { scanUploads: { type: Boolean, default: false }, blockExecutableFiles: { type: Boolean, default: true }, allowedExtensions: [String], maxFileSizeMB: { type: Number, default: 50 } },
    audit: { logLogin: { type: Boolean, default: true }, logSettingsChanges: { type: Boolean, default: true }, logPermissionChanges: { type: Boolean, default: true }, logFileDownloads: { type: Boolean, default: false } },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.SecuritySettings || mongoose.model('SecuritySettings', securitySettingsSchema);
