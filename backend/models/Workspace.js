const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true, lowercase: true },
  companyName: String,
  description: String,
  logo: String,
  favicon: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: { type: String, enum: ["owner", "admin", "manager", "member", "viewer"], default: "member" },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    customRole: { type: mongoose.Schema.Types.ObjectId, ref: "CustomRole" },
    designation: String,
    allowedModulesOverride: [String],
    deniedModulesOverride: [String],
    addedAt: Date,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true }
  }],
  allowedModules: {
    dashboard: Boolean, projects: Boolean, tasks: Boolean, tracker: Boolean,
    calendar: Boolean, reports: Boolean, media: Boolean, mom: Boolean,
    meetings: Boolean, budget: Boolean, expenses: Boolean, sla: Boolean,
    intake: Boolean, notes: Boolean, wiki: Boolean, vendors: Boolean, settings: Boolean,
    workspace: Boolean, departments: Boolean, users: Boolean, timesheets: Boolean,
    campaigns: Boolean, contentCalendar: Boolean, content_calendar: Boolean, timesheets: Boolean, approvals: Boolean, notifications: Boolean,
    email_templates: Boolean, activity_logs: Boolean, backup: Boolean, api_keys: Boolean
  },
  settings: {
    timezone: { type: String, default: "Asia/Kolkata" },
    dateFormat: { type: String, default: "DD-MM-YYYY" },
    timeFormat: { type: String, enum: ["12h", "24h"], default: "12h" },
    currency: { type: String, default: "INR" },
    financialYearStartMonth: { type: Number, default: 4 },
    weekStartDay: { type: String, enum: ["sunday", "monday"], default: "monday" },
    workingDays: {
      monday: { type: Boolean, default: true },
      tuesday: { type: Boolean, default: true },
      wednesday: { type: Boolean, default: true },
      thursday: { type: Boolean, default: true },
      friday: { type: Boolean, default: true },
      saturday: { type: Boolean, default: false },
      sunday: { type: Boolean, default: false }
    },
    workingHours: {
      start: { type: String, default: "10:00" },
      end: { type: String, default: "18:00" }
    }
  },
  storage: {
    provider: { type: String, enum: ["local"], default: "local" },
    uploadPath: String,
    maxFileSizeMB: { type: Number, default: 50 },
    maxStorageGB: { type: Number, default: 100 },
    usedStorageBytes: { type: Number, default: 0 }
  },
  brand: {
    primaryColor: String,
    secondaryColor: String,
    darkLogo: String,
    lightLogo: String,
    favicon: String,
    fontFamily: String
  },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  archivedAt: Date,
  archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

schema.index({ slug: 1 }, { unique: true });
schema.index({ owner: 1 });
schema.index({ "members.user": 1 });

module.exports = mongoose.models.Workspace || mongoose.model('Workspace', schema);
