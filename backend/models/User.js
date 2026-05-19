const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const notificationChannel = {
  inApp: { type: Boolean, default: true },
  email: { type: Boolean, default: true }
};

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, lowercase: true, trim: true, required: true },
  password: { type: String, select: false },
  phone: String,
  avatar: String,
  designation: String,
  departmentName: String,
  employeeCode: String,
  jd: String,
  bio: String,
  refreshToken: { type: String, select: false },
  authProvider: { type: String, enum: ["local", "google"], default: "local" },
  googleId: { type: String, sparse: true },
  isGoogleAuth: { type: Boolean, default: false },
  globalRole: { type: String, enum: ["super_admin", "admin", "user"], default: "user" },
  role: { type: String, enum: ["super_admin", "admin", "manager", "member", "viewer", "employee", "client"], default: "member" },
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
    isActive: { type: Boolean, default: true }
  }],
  defaultWorkspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  isEmailVerified: { type: Boolean, default: false },
  emailVerifiedAt: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  passwordChangedAt: Date,
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, select: false },
  backupCodes: [{
    codeHash: String,
    code: { type: String, select: false },
    used: { type: Boolean, default: false },
    usedAt: Date
  }],
  mustChangePassword: { type: Boolean, default: false },
  preferences: {
    theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
    language: { type: String, default: "en" },
    timezone: { type: String, default: "Asia/Kolkata" },
    dateFormat: { type: String, default: "DD-MM-YYYY" },
    timeFormat: { type: String, enum: ["12h", "24h"], default: "12h" }
  },
  notificationPreferences: {
    taskAssigned: notificationChannel,
    taskOverdue: notificationChannel,
    mention: notificationChannel,
    meetingReminder: notificationChannel,
    slaBreach: notificationChannel,
    taskCommented: notificationChannel,
    momCreated: notificationChannel,
    meetingScheduled: notificationChannel,
    slaBreached: notificationChannel,
    budgetAlert: notificationChannel,
    dailyDigest: { email: { type: Boolean, default: true }, inApp: { type: Boolean, default: true } }
  },
  themePreference: { type: String, enum: ["light", "dark", "system"], default: "system" },
  status: {
    type: String,
    enum: ["active", "inactive", "suspended", "pending_verification"],
    default: "pending_verification"
  },
  lastLoginAt: Date,
  lastLoginIp: String,
  failedLoginCount: { type: Number, default: 0 },
  lockedUntil: Date,
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

schema.index({ "workspaces.workspace": 1 });
schema.index({ "workspaces.department": 1 });
schema.index({ "workspaces.role": 1 });

schema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
schema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User
  ? delete mongoose.models.User && mongoose.model('User', schema)
  : mongoose.model('User', schema);
