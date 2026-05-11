const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true, trim: true, required: true },
  password: { type: String, select: false },
  phone: String,
  avatar: String,
  designation: String,
  employeeCode: String,
  jd: String,
  bio: String,
  authProvider: { type: String, enum: ["local", "google"], default: "local" },
  googleId: String,
  isGoogleAuth: Boolean,
  globalRole: { type: String, enum: ["super_admin", "user"], default: "user" },
  role: { type: String, enum: ["super_admin", "admin", "manager", "member", "viewer"], default: "member" },
  workspaces: [{
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
    role: { type: String, enum: ["owner", "admin", "manager", "member", "viewer"], default: "member" },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    customRole: { type: mongoose.Schema.Types.ObjectId, ref: "CustomRole" },
    allowedModulesOverride: [String],
    deniedModulesOverride: [String],
    customPermissions: [{ module: String, actions: [String] }],
    joinedAt: Date,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: Boolean
  }],
  defaultWorkspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: String,
  backupCodes: [{ code: String, used: Boolean, usedAt: Date }],
  notificationPreferences: {
    taskAssigned: { inApp: Boolean, email: Boolean },
    taskOverdue: { inApp: Boolean, email: Boolean },
    taskCommented: { inApp: Boolean, email: Boolean },
    momCreated: { inApp: Boolean, email: Boolean },
    meetingScheduled: { inApp: Boolean, email: Boolean },
    slaBreached: { inApp: Boolean, email: Boolean },
    budgetAlert: { inApp: Boolean, email: Boolean },
    dailyDigest: { inApp: Boolean, email: Boolean }
  },
  themePreference: { type: String, enum: ["light", "dark", "system"], default: "system" },
  lastLoginAt: Date,
  lastLoginIp: String,
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', schema);
