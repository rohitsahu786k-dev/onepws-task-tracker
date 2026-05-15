const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  system: { appName: String, defaultLanguage: String, timezone: String, dateFormat: String, timeFormat: String, calendarStartDay: String, emailVerificationRequired: Boolean, forceTwoFactorAuth: Boolean },
  brand: { darkLogo: String, lightLogo: String, favicon: String, primaryColor: String, secondaryColor: String, fontFamily: String, companyName: String },
  email: { provider: { type: String, enum: ["smtp", "sendgrid", "mailgun"], default: "smtp" }, smtpHost: String, smtpPort: Number, smtpUser: String, smtpPasswordEncrypted: String, fromAddress: String, fromName: String, encryption: { type: String, enum: ["none", "ssl", "tls"] } },
  emailNotifications: { workspaceInvitation: Boolean, taskAssignment: Boolean, taskOverdue: Boolean, taskComment: Boolean, meetingScheduled: Boolean, momCreated: Boolean, momSigned: Boolean, slaBreach: Boolean, budgetApproval: Boolean, expenseApproval: Boolean, dailyDigest: Boolean },
  storage: { provider: { type: String, enum: ["local"], default: "local" }, uploadPath: String, maxFileSizeMB: Number, allowedFileTypes: [String] },
  slack: { enabled: Boolean, webhookUrlEncrypted: String, defaultChannel: String },
  telegram: { enabled: Boolean, botTokenEncrypted: String, chatId: String },
  googleOAuth: { enabled: Boolean, clientId: String, clientSecretEncrypted: String, callbackUrl: String },
  zoom: { enabled: Boolean, accountId: String, clientId: String, clientSecretEncrypted: String, defaultDurationMinutes: Number },
  googleMeet: { enabled: Boolean, credentialsJsonEncrypted: String, clientId: String, clientSecretEncrypted: String, redirectUri: String, refreshTokenEncrypted: String, connectedEmail: String, connectedAt: Date },
  meetingSettings: {
    defaultDurationMinutes: { type: Number, default: 60 },
    defaultReminders: [{ type: Number }],
    allowExternalAttendees: { type: Boolean, default: true },
    requireAgenda: { type: Boolean, default: true },
    requireMOMForKickoff: { type: Boolean, default: true },
    autoCreateMOMAfterMeeting: { type: Boolean, default: false },
    allowMembersToCreateMeetings: { type: Boolean, default: true }
  },
  automation: {
    enabled: { type: Boolean, default: true },
    taskDueTodayTime: { type: String, default: '08:00' },
    taskDueTomorrowTime: { type: String, default: '18:00' },
    overdueCheckTime: { type: String, default: '09:00' },
    dailyDigestTime: { type: String, default: '19:00' },
    weeklySummaryDay: { type: Number, default: 1 },
    weeklySummaryTime: { type: String, default: '09:00' },
    slaBreachCheckEnabled: { type: Boolean, default: true },
    autoHoldEnabled: { type: Boolean, default: true },
    autoCloseEnabled: { type: Boolean, default: true },
    backupEnabled: { type: Boolean, default: true },
    backupTime: { type: String, default: '02:00' },
    backupRetentionDays: { type: Number, default: 30 },
    mediaCleanupEnabled: { type: Boolean, default: true }
  },
  recaptcha: { enabled: Boolean, siteKey: String, secretKeyEncrypted: String },
  chatGPT: { enabled: Boolean, apiKeyEncrypted: String, model: String, maxTokens: Number },
  seo: { metaTitle: String, metaDescription: String, googleAnalyticsId: String, googleTagManagerId: String },
  ipWhitelist: { enabled: Boolean, allowedIps: [String] },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.SystemSettings || mongoose.model('SystemSettings', schema);
