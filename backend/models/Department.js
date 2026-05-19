const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  name: { type: String, required: true },
  code: { type: String, uppercase: true },
  description: String,
  parentDepartment: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  head: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    designation: String,
    role: { type: String, enum: ["head", "manager", "member", "viewer"], default: "member" },
    roleInDepartment: { type: String, enum: ["head", "manager", "member", "viewer"], default: "member" },
    joinedAt: Date
  }],
  permissions: {
    canCreateRequest: Boolean, canViewOwnRequests: Boolean, canViewDepartmentRequests: Boolean,
    canApproveMOM: Boolean, canAccessReports: Boolean, canAccessBudget: Boolean, canAccessTracker: Boolean
  },
  allowedModules: { type: mongoose.Schema.Types.Mixed, default: () => ({ tasks: true, intake: true, calendar: true, mom: true, meetings: true, reports: false, tracker: false, budget: false, media: true }) },
  color: String,
  icon: String,
  order: { type: Number, default: 0 },
  isSystemDepartment: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

schema.index({ workspace: 1, code: 1 }, { unique: true, sparse: true });
schema.index({ workspace: 1, name: 1 });
schema.index({ workspace: 1, parentDepartment: 1 });
schema.index({ workspace: 1, isActive: 1 });

module.exports = mongoose.models.Department || mongoose.model('Department', schema);
