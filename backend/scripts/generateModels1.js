const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../models');
if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });

const models = {};

// 1. User Schema
models['User.js'] = `const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
  role: { type: String, enum: ["super_admin", "admin", "manager", "member", "viewer"], default: "member" },
  workspaces: [{
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
    role: { type: String, enum: ["owner", "admin", "manager", "member", "viewer"] },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    joinedAt: Date,
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
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  refreshToken: String,
  lastLogin: Date
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ "workspaces.workspace": 1 });

module.exports = mongoose.model('User', userSchema);
`;

// 2. Session Schema
models['Session.js'] = `const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  refreshToken: { type: String, required: true },
  deviceName: String,
  browser: String,
  os: String,
  ipAddress: String,
  location: { country: String, city: String },
  userAgent: String,
  isRevoked: { type: Boolean, default: false },
  lastActiveAt: Date,
  expiresAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
`;

// 3. Workspace Schema
models['Workspace.js'] = `const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
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
    intake: Boolean, notes: Boolean, wiki: Boolean, vendors: Boolean, settings: Boolean
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

workspaceSchema.index({ owner: 1 });

module.exports = mongoose.model('Workspace', workspaceSchema);
`;

// 4. WorkspaceInvite
models['WorkspaceInvite.js'] = `const mongoose = require('mongoose');

const workspaceInviteSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  email: { type: String, required: true, lowercase: true },
  role: { type: String, enum: ["admin", "manager", "member", "viewer"], default: "member" },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  token: String,
  expiresAt: Date,
  status: { type: String, enum: ["pending", "accepted", "expired", "cancelled"], default: "pending" },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  acceptedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('WorkspaceInvite', workspaceInviteSchema);
`;

// 5. Department
models['Department.js'] = `const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  name: { type: String, required: true },
  code: { type: String, uppercase: true },
  description: String,
  head: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    designation: String,
    joinedAt: Date
  }],
  permissions: {
    canCreateRequest: Boolean,
    canViewOwnRequests: Boolean,
    canViewDepartmentRequests: Boolean,
    canApproveMOM: Boolean,
    canAccessReports: Boolean,
    canAccessBudget: Boolean
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

departmentSchema.index({ workspace: 1, code: 1 }, { unique: true, sparse: true });
departmentSchema.index({ workspace: 1, name: 1 });

module.exports = mongoose.model('Department', departmentSchema);
`;

// 6. Project
models['Project.js'] = `const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  title: { type: String, required: true },
  projectCode: { type: String, unique: true },
  description: String,
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  requestingDepartment: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: String
  }],
  status: { type: String, enum: ["planning", "active", "on_hold", "completed", "cancelled", "archived"], default: "planning" },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  startDate: Date,
  dueDate: Date,
  completedAt: Date,
  progressPercent: { type: Number, default: 0 },
  tags: [String],
  budget: { type: mongoose.Schema.Types.ObjectId, ref: "Budget" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

projectSchema.index({ workspace: 1, status: 1 });
projectSchema.index({ workspace: 1, department: 1 });
projectSchema.index({ workspace: 1, dueDate: 1 });

module.exports = mongoose.model('Project', projectSchema);
`;

// 7. Milestone
models['Milestone.js'] = `const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  title: String,
  description: String,
  dueDate: Date,
  completedAt: Date,
  responsiblePerson: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "in_progress", "completed", "delayed"], default: "pending" },
  order: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model('Milestone', milestoneSchema);
`;

// 8. Task Stage
models['TaskStage.js'] = `const mongoose = require('mongoose');

const taskStageSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  name: { type: String, required: true },
  key: String,
  color: String,
  order: Number,
  type: { type: String, enum: ["todo", "in_progress", "review", "blocked", "done", "custom"], default: "custom" },
  isDefault: { type: Boolean, default: false },
  isFinalStage: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('TaskStage', taskStageSchema);
`;

// 9. Task
models['Task.js'] = `const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  taskNumber: { type: String, unique: true },
  title: { type: String, required: true },
  description: String,
  taskCategory: { type: String, enum: ["Catalogue", "Brochure", "Flyer", "Social Media", "PPT", "Email Campaign", "Website Update", "Events", "Other"] },
  deliverableType: { type: String, enum: ["CAT-S", "CAT-M", "CAT-L", "BROCHURE", "FLYER", "SOCIAL", "PPT-S", "PPT-L", "EMAIL", "EVENT", "WEB", "OTHER"] },
  requestType: { type: String, enum: ["new_work", "rework"], default: "new_work" },
  revisionNumber: { type: String, default: "R0" },
  stage: { type: mongoose.Schema.Types.ObjectId, ref: "TaskStage" },
  status: { type: String, enum: ["open", "in_process", "review", "hold", "closed", "cancelled"], default: "open" },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  requestedByDepartment: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  taskProvidedBy: String,
  taskGivenByDepartmentText: String,
  productType: { type: String, enum: ["CD", "CCR", "MOT", "FLOOR", "Other"] },
  receiptDate: Date,
  finalInputReceiptDate: Date,
  targetDueDate: Date,
  actualClosingDate: Date,
  delayInDays: Number,
  delayStatus: { type: String, enum: ["on_time", "delayed", "early", "pending"], default: "pending" },
  estimatedHours: Number,
  loggedHours: Number,
  dueDate: Date,
  startDate: Date,
  completedAt: Date,
  isOverdue: Boolean,
  isLocked: Boolean,
  remarkIfPending: String,
  finalStatus: { type: String, enum: ["pending", "submitted", "closed"], default: "pending" },
  tags: [String],
  customFields: { type: Map, of: mongoose.Schema.Types.Mixed },
  intakeForm: { type: mongoose.Schema.Types.ObjectId, ref: "IntakeForm" },
  slaTracker: { type: mongoose.Schema.Types.ObjectId, ref: "SLATracker" },
  calendarEvent: { type: mongoose.Schema.Types.ObjectId, ref: "CalendarEvent" },
  publicShare: { enabled: Boolean, token: String, expiresAt: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

taskSchema.index({ workspace: 1, status: 1 });
taskSchema.index({ workspace: 1, stage: 1 });
taskSchema.index({ workspace: 1, assignedTo: 1 });
taskSchema.index({ workspace: 1, dueDate: 1 });
taskSchema.index({ workspace: 1, finalInputReceiptDate: 1 });
taskSchema.index({ workspace: 1, deliverableType: 1 });
taskSchema.index({ workspace: 1, createdAt: 1 });
taskSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Task', taskSchema);
`;

// 10-16: SubTask, TaskComment, TaskAttachment, TaskHistory, TaskDependency, TaskTemplate, TaskTimer
models['SubTask.js'] = `const mongoose = require('mongoose');
const subTaskSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  parentTask: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  title: String, description: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "in_progress", "completed"], default: "pending" },
  dueDate: Date, completedAt: Date, order: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
module.exports = mongoose.model('SubTask', subTaskSchema);
`;

models['TaskComment.js'] = `const mongoose = require('mongoose');
const taskCommentSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  comment: String,
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  attachments: [{ fileName: String, filePath: String, fileUrl: String, mimeType: String, size: Number }],
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "TaskComment" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isEdited: Boolean
}, { timestamps: true });
module.exports = mongoose.model('TaskComment', taskCommentSchema);
`;

models['TaskAttachment.js'] = `const mongoose = require('mongoose');
const taskAttachmentSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  originalName: String, storedName: String, filePath: String, fileUrl: String,
  mimeType: String, extension: String, size: Number,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
module.exports = mongoose.model('TaskAttachment', taskAttachmentSchema);
`;

models['TaskHistory.js'] = `const mongoose = require('mongoose');
const taskHistorySchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  action: { type: String, enum: ["created", "updated", "stage_changed", "assigned", "commented", "attachment_added", "status_changed", "due_date_changed", "deleted", "restored"] },
  fieldChanged: String, oldValue: mongoose.Schema.Types.Mixed, newValue: mongoose.Schema.Types.Mixed,
  message: String, performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  ipAddress: String, userAgent: String, createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('TaskHistory', taskHistorySchema);
`;

models['TaskDependency.js'] = `const mongoose = require('mongoose');
const taskDependencySchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  dependsOnTask: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  dependencyType: { type: String, enum: ["blocks", "relates_to", "duplicates", "parent_child"], default: "blocks" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('TaskDependency', taskDependencySchema);
`;

models['TaskTemplate.js'] = `const mongoose = require('mongoose');
const taskTemplateSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String, description: String,
  taskCategory: String, deliverableType: String,
  defaultPriority: String, defaultAssignees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  checklist: [{ title: String, order: Number }],
  defaultFields: { type: Map, of: mongoose.Schema.Types.Mixed },
  slaConfig: { type: mongoose.Schema.Types.ObjectId, ref: "SLAConfig" },
  isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
module.exports = mongoose.model('TaskTemplate', taskTemplateSchema);
`;

models['TaskTimer.js'] = `const mongoose = require('mongoose');
const taskTimerSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  startedAt: Date, stoppedAt: Date, durationSeconds: Number, note: String,
  status: { type: String, enum: ["running", "stopped"], default: "running" }
}, { timestamps: true });
module.exports = mongoose.model('TaskTimer', taskTimerSchema);
`;

for (const [filename, content] of Object.entries(models)) {
  fs.writeFileSync(path.join(modelsDir, filename), content);
}
console.log('Batch 1 models generated.');
