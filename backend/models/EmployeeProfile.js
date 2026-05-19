const mongoose = require('mongoose');

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const employeeProfileSchema = new Schema(
  {
    workspace: { type: ObjectId, ref: 'Workspace', required: true },
    user: { type: ObjectId, ref: 'User', required: true },
    employeeCode: { type: String, required: true },
    employeeType: { type: String, enum: ['full_time', 'part_time', 'contract', 'intern', 'consultant', 'vendor', 'external'], default: 'full_time' },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    displayName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: String,
    alternatePhone: String,
    profileImage: { mediaFile: { type: ObjectId, ref: 'MediaFile' }, url: String },
    department: { type: ObjectId, ref: 'Department' },
    designation: { type: ObjectId, ref: 'Designation' },
    jobTitle: String,
    reportingManager: { type: ObjectId, ref: 'User' },
    workspaceRole: { type: String, enum: ['owner', 'admin', 'manager', 'member', 'viewer', 'finance', 'approver', 'external'], default: 'member' },
    systemRole: { type: String, enum: ['super_admin', 'user'], default: 'user' },
    employmentStatus: { type: String, enum: ['active', 'inactive', 'on_leave', 'suspended', 'terminated', 'invited', 'pending'], default: 'active' },
    availabilityStatus: { type: String, enum: ['available', 'busy', 'in_meeting', 'on_leave', 'offline', 'do_not_disturb'], default: 'available' },
    availabilityMessage: String,
    joiningDate: Date,
    exitDate: Date,
    workLocation: { type: String, enum: ['office', 'remote', 'hybrid', 'field'], default: 'office' },
    officeLocation: String,
    timezone: { type: String, default: 'Asia/Kolkata' },
    skills: [
      {
        name: String,
        level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'intermediate' },
        yearsOfExperience: Number,
      },
    ],
    modulesAllowed: [String],
    permissions: [String],
    emergencyContact: { name: String, relation: String, phone: String },
    socialLinks: { linkedin: String, website: String, portfolio: String },
    bio: String,
    notes: String,
    preferences: {
      language: { type: String, default: 'en' },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      emailNotifications: { type: Boolean, default: true },
      inAppNotifications: { type: Boolean, default: true },
    },
    workloadSummary: {
      openTasks: { type: Number, default: 0 },
      overdueTasks: { type: Number, default: 0 },
      activeProjects: { type: Number, default: 0 },
      loggedHoursThisWeek: { type: Number, default: 0 },
      capacityHoursPerWeek: { type: Number, default: 40 },
      workloadPercent: { type: Number, default: 0 },
    },
    lastLoginAt: Date,
    lastActiveAt: Date,
    isDirectoryVisible: { type: Boolean, default: true },
    isProfileComplete: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: ObjectId, ref: 'User' },
    createdBy: { type: ObjectId, ref: 'User' },
    updatedBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

employeeProfileSchema.index({ workspace: 1, user: 1 }, { unique: true });
employeeProfileSchema.index({ workspace: 1, employeeCode: 1 }, { unique: true });
employeeProfileSchema.index({ workspace: 1, email: 1 });
employeeProfileSchema.index({ workspace: 1, department: 1 });
employeeProfileSchema.index({ workspace: 1, designation: 1 });
employeeProfileSchema.index({ workspace: 1, reportingManager: 1 });
employeeProfileSchema.index({ workspace: 1, workspaceRole: 1 });
employeeProfileSchema.index({ workspace: 1, employmentStatus: 1 });
employeeProfileSchema.index({ workspace: 1, availabilityStatus: 1 });
employeeProfileSchema.index({ workspace: 1, isDirectoryVisible: 1 });
employeeProfileSchema.index({ displayName: 'text', email: 'text', employeeCode: 'text', 'skills.name': 'text' });

module.exports = mongoose.models.EmployeeProfile || mongoose.model('EmployeeProfile', employeeProfileSchema);
