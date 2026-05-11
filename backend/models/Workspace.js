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
    role: { type: String, enum: ["owner", "admin", "manager", "member", "viewer"] },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    addedAt: Date,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: Boolean
  }],
  allowedModules: {
    dashboard: Boolean, projects: Boolean, tasks: Boolean, tracker: Boolean,
    calendar: Boolean, reports: Boolean, media: Boolean, mom: Boolean,
    meetings: Boolean, budget: Boolean, expenses: Boolean, sla: Boolean,
    intake: Boolean, notes: Boolean, wiki: Boolean, vendors: Boolean, settings: Boolean,
    workspace: Boolean, departments: Boolean, users: Boolean, timesheets: Boolean,
    campaigns: Boolean, content_calendar: Boolean, notifications: Boolean,
    email_templates: Boolean, activity_logs: Boolean, backup: Boolean, api_keys: Boolean
  },
  settings: {
    timezone: { type: String, default: "Asia/Kolkata" },
    dateFormat: { type: String, default: "DD-MM-YYYY" },
    timeFormat: { type: String, enum: ["12h", "24h"], default: "12h" },
    currency: { type: String, default: "INR" },
    financialYearStartMonth: { type: Number, default: 4 }
  },
  storage: {
    provider: { type: String, enum: ["local"], default: "local" },
    uploadPath: String,
    maxFileSizeMB: Number
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.models.Workspace || mongoose.model('Workspace', schema);
