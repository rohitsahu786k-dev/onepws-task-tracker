const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const generateFile = (name, schemaObj, hasTimestamps = true) => {
  const content = "const mongoose = require('mongoose');\n\n" +
                  "const schema = new mongoose.Schema(" + schemaObj + ", { timestamps: " + hasTimestamps + " });\n\n" +
                  "module.exports = mongoose.models." + name + " || mongoose.model('" + name + "', schema);\n";
  fs.writeFileSync(path.join(modelsDir, name + '.js'), content, 'utf8');
};

// 1. User
generateFile('User', `{
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
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 2. Session
generateFile('Session', `{
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
}`);

// 3. Workspace
generateFile('Workspace', `{
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
}`);

// 4. WorkspaceInvite
generateFile('WorkspaceInvite', `{
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
}`);

// 5. Department
generateFile('Department', `{
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
    canCreateRequest: Boolean, canViewOwnRequests: Boolean, canViewDepartmentRequests: Boolean,
    canApproveMOM: Boolean, canAccessReports: Boolean, canAccessBudget: Boolean
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 6. Project
generateFile('Project', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  title: { type: String, required: true },
  projectCode: { type: String, unique: true },
  description: String,
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  requestingDepartment: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, role: String }],
  status: { type: String, enum: ["planning", "active", "on_hold", "completed", "cancelled", "archived"], default: "planning" },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  startDate: Date, dueDate: Date, completedAt: Date,
  progressPercent: { type: Number, default: 0 },
  tags: [String],
  budget: { type: mongoose.Schema.Types.ObjectId, ref: "Budget" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 7. Milestone
generateFile('Milestone', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  title: String, description: String,
  dueDate: Date, completedAt: Date,
  responsiblePerson: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "in_progress", "completed", "delayed"], default: "pending" },
  order: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 8. TaskStage
generateFile('TaskStage', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  name: { type: String, required: true },
  key: String, color: String, order: Number,
  type: { type: String, enum: ["todo", "in_progress", "review", "blocked", "done", "custom"], default: "custom" },
  isDefault: { type: Boolean, default: false },
  isFinalStage: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}`);

// 9. Task
generateFile('Task', `{
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
  estimatedHours: Number, loggedHours: Number,
  dueDate: Date, startDate: Date, completedAt: Date,
  isOverdue: Boolean, isLocked: Boolean,
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
}`);

// 10. SubTask
generateFile('SubTask', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  parentTask: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  title: String, description: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "in_progress", "completed"], default: "pending" },
  dueDate: Date, completedAt: Date, order: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 11. TaskComment
generateFile('TaskComment', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  comment: String,
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  attachments: [{ fileName: String, filePath: String, fileUrl: String, mimeType: String, size: Number }],
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "TaskComment" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isEdited: Boolean
}`);

// 12. TaskAttachment
generateFile('TaskAttachment', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  originalName: String, storedName: String, filePath: String, fileUrl: String,
  mimeType: String, extension: String, size: Number,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 13. TaskHistory
generateFile('TaskHistory', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  action: { type: String, enum: ["created", "updated", "stage_changed", "assigned", "commented", "attachment_added", "status_changed", "due_date_changed", "deleted", "restored"] },
  fieldChanged: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  message: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  ipAddress: String, userAgent: String
}`, false);

// 14. TaskDependency
generateFile('TaskDependency', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  dependsOnTask: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  dependencyType: { type: String, enum: ["blocks", "relates_to", "duplicates", "parent_child"], default: "blocks" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`, false);

// 15. TaskTemplate
generateFile('TaskTemplate', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String, description: String,
  taskCategory: String, deliverableType: String,
  defaultPriority: String,
  defaultAssignees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  checklist: [{ title: String, order: Number }],
  defaultFields: { type: Map, of: mongoose.Schema.Types.Mixed },
  slaConfig: { type: mongoose.Schema.Types.ObjectId, ref: "SLAConfig" },
  isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 16. TaskTimer
generateFile('TaskTimer', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  startedAt: Date, stoppedAt: Date,
  durationSeconds: Number, note: String,
  status: { type: String, enum: ["running", "stopped"], default: "running" }
}`);

// 17. TrackerFieldConfig
generateFile('TrackerFieldConfig', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  name: { type: String, default: "Marketing Daily Task Tracker" },
  description: String,
  fields: [{
    fieldId: String, label: { type: String, required: true }, fieldKey: { type: String, required: true },
    fieldType: { type: String, enum: ["text", "number", "date", "dropdown", "auto", "checkbox", "textarea", "user", "department", "file", "status"], required: true },
    isRequired: { type: Boolean, default: false }, isEditable: { type: Boolean, default: true },
    isVisible: { type: Boolean, default: true }, isSystem: { type: Boolean, default: false },
    isLockedAfterSubmit: { type: Boolean, default: false },
    order: Number, width: Number, placeholder: String, helpText: String, defaultValue: mongoose.Schema.Types.Mixed,
    dropdownOptions: [{ label: String, value: String, color: String, order: Number, isActive: Boolean }],
    validation: { min: Number, max: Number, regex: String, minLength: Number, maxLength: Number },
    autoFormula: {
      formulaType: { type: String, enum: ["serial_number", "task_number", "date_plus_working_days", "date_difference", "delay_status", "custom"] },
      sourceField: String, targetField: String, daysToAdd: Number, excludeWeekends: Boolean, excludeHolidays: Boolean, customExpression: String
    }
  }],
  isDefault: Boolean, isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 18. TrackerRow
generateFile('TrackerRow', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  config: { type: mongoose.Schema.Types.ObjectId, ref: "TrackerFieldConfig", required: true },
  rowNumber: Number,
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  rowData: { type: Map, of: mongoose.Schema.Types.Mixed },
  calculatedData: { type: Map, of: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ["draft", "pending", "submitted", "locked", "archived"], default: "draft" },
  isLocked: { type: Boolean, default: false },
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, lockedAt: Date,
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, submittedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 19. TrackerImport
generateFile('TrackerImport', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  config: { type: mongoose.Schema.Types.ObjectId, ref: "TrackerFieldConfig" },
  originalFileName: String, filePath: String,
  totalRows: Number, successRows: Number, failedRows: Number,
  errors: [{ rowNumber: Number, fieldKey: String, message: String }],
  status: { type: String, enum: ["processing", "completed", "failed"], default: "processing" },
  importedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 20. SLAConfig
generateFile('SLAConfig', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  deliverableType: { type: String, enum: ["CAT-S", "CAT-M", "CAT-L", "BROCHURE", "FLYER", "SOCIAL", "PPT-S", "PPT-L", "EMAIL", "EVENT", "WEB"], required: true },
  title: String, newWorkTotalDays: Number, reworkTotalDays: Number,
  phases: [{ phaseName: String, phaseKey: String, order: Number, newWorkDays: Number, reworkDays: Number, responsibleRole: String, requiresApproval: Boolean }],
  rules: { dayZeroStartsAfterCompleteInput: Boolean, kickoffMeetingRequired: Boolean, momRequiredBeforeStart: Boolean, maxDraftCycles: Number, feedbackWithinWorkingDays: Number, autoHoldAfterNoFeedbackDays: Number, autoCloseAfterNoFeedbackDays: Number, changeAboveThirtyPercentResetT0: Boolean },
  escalationMatrix: [{ delayDays: Number, escalateToRole: String, escalateToUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, action: String }],
  isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 21. SLATracker
generateFile('SLATracker', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  slaConfig: { type: mongoose.Schema.Types.ObjectId, ref: "SLAConfig" },
  requestType: { type: String, enum: ["new_work", "rework"] },
  t0Date: Date, kickoffMeetingDate: Date, momSignedAt: Date, currentPhase: String,
  phases: [{
    phaseName: String, phaseKey: String, order: Number,
    plannedStartDate: Date, plannedEndDate: Date, actualStartDate: Date, actualEndDate: Date,
    status: { type: String, enum: ["pending", "in_progress", "completed", "delayed", "skipped"], default: "pending" },
    delayDays: Number, approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, approvedAt: Date
  }],
  overallStatus: { type: String, enum: ["on_track", "at_risk", "breached", "completed", "on_hold"], default: "on_track" },
  totalDelayDays: Number,
  isT0Reset: Boolean, t0ResetReason: String, t0ResetAt: Date, t0ResetBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 22. SLAEscalation
generateFile('SLAEscalation', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  slaTracker: { type: mongoose.Schema.Types.ObjectId, ref: "SLATracker" },
  escalationLevel: Number, delayDays: Number,
  escalatedTo: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, role: String }],
  message: String,
  status: { type: String, enum: ["sent", "acknowledged", "resolved"], default: "sent" },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, acknowledgedAt: Date,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, resolvedAt: Date
}`);

// 23. IntakeFormConfig
generateFile('IntakeFormConfig', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  deliverableType: { type: String, required: true },
  title: String, description: String,
  questions: [{
    questionId: String, label: String, fieldKey: String,
    questionType: { type: String, enum: ["text", "textarea", "number", "date", "dropdown", "multi_select", "file", "checkbox", "radio"] },
    priority: { type: String, enum: ["critical", "important", "useful"], default: "important" },
    isRequired: Boolean,
    options: [{ label: String, value: String }],
    order: Number, helpText: String
  }],
  isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 24. IntakeForm
generateFile('IntakeForm', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  formConfig: { type: mongoose.Schema.Types.ObjectId, ref: "IntakeFormConfig" },
  requestNumber: { type: String, unique: true },
  deliverableType: String,
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  requestingDepartment: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  answers: { type: Map, of: mongoose.Schema.Types.Mixed },
  attachments: [{ fileName: String, filePath: String, fileUrl: String, mimeType: String, size: Number }],
  status: { type: String, enum: ["draft", "submitted", "under_review", "approved", "rejected", "t0_confirmed", "task_created", "closed"], default: "draft" },
  review: { reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, reviewedAt: Date, remarks: String, rejectionReason: String },
  marketingConfirmationEmailSent: Boolean, t0Date: Date,
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" }
}`);

// 25. MOM
generateFile('MOM', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  momNumber: { type: String, unique: true },
  docNumber: { type: String, default: "IMS-01-04-L4-04" },
  title: String,
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  meeting: { type: mongoose.Schema.Types.ObjectId, ref: "Meeting" },
  meetingDate: Date, location: String, agenda: String,
  attendees: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String, department: String, designation: String, email: String,
    signatureRequired: Boolean, signed: Boolean, signedAt: Date
  }],
  status: { type: String, enum: ["draft", "sent_for_signature", "partially_signed", "signed", "closed"], default: "draft" },
  pdfFilePath: String, pdfFileUrl: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 26. MOMPoint
generateFile('MOMPoint', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  mom: { type: mongoose.Schema.Types.ObjectId, ref: "MOM" },
  pointNumber: Number, discussionPoint: String, decisionTaken: String,
  responsiblePerson: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  targetClosureDate: Date, actualClosureDate: Date,
  status: { type: String, enum: ["open", "in_progress", "closed", "overdue"], default: "open" },
  remarks: String
}`);

// 27. MOMSignature
generateFile('MOMSignature', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  mom: { type: mongoose.Schema.Types.ObjectId, ref: "MOM" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String, designation: String, department: String,
  signatureText: String, signatureImage: String,
  ipAddress: String, userAgent: String,
  signedAt: Date
}`);

// 28. Meeting
generateFile('Meeting', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  meetingNumber: { type: String, unique: true },
  title: String, description: String, agenda: String,
  meetingType: { type: String, enum: ["internal", "client", "vendor", "kickoff", "review", "other"], default: "internal" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  startDateTime: Date, endDateTime: Date, durationMinutes: Number,
  locationType: { type: String, enum: ["physical", "zoom", "google_meet", "manual_link"], default: "physical" },
  location: String, meetingLink: String, zoomMeetingId: String, zoomPassword: String, googleMeetLink: String,
  attendees: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String, email: String,
    status: { type: String, enum: ["pending", "accepted", "declined", "tentative"], default: "pending" }
  }],
  reminders: [{ minutesBefore: Number, sent: Boolean, sentAt: Date }],
  calendarEvent: { type: mongoose.Schema.Types.ObjectId, ref: "CalendarEvent" },
  mom: { type: mongoose.Schema.Types.ObjectId, ref: "MOM" },
  status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 29. CalendarEvent
generateFile('CalendarEvent', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  title: String, description: String,
  eventType: { type: String, enum: ["task", "meeting", "mom", "sla", "budget", "holiday", "reminder", "custom"] },
  startDate: Date, endDate: Date, allDay: Boolean, color: String,
  refModel: { type: String, enum: ["Task", "Meeting", "MOM", "SLATracker", "Budget", "Expense", "Holiday", null] },
  refId: mongoose.Schema.Types.ObjectId,
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  isRecurring: Boolean,
  recurrenceRule: { frequency: { type: String, enum: ["daily", "weekly", "monthly", "yearly"] }, interval: Number, daysOfWeek: [String], endDate: Date },
  reminders: [{ minutesBefore: Number, sent: Boolean }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 30. Holiday
generateFile('Holiday', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String, date: Date,
  type: { type: String, enum: ["public", "company", "optional"], default: "company" },
  isRecurringYearly: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 31. MediaFolder
generateFile('MediaFolder', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String,
  parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: "MediaFolder" },
  path: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 32. MediaFile
generateFile('MediaFile', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  folder: { type: mongoose.Schema.Types.ObjectId, ref: "MediaFolder" },
  originalName: String, storedName: String, filePath: String, fileUrl: String,
  thumbnailPath: String, thumbnailUrl: String,
  mimeType: String, extension: String, size: Number,
  fileCategory: { type: String, enum: ["image", "document", "video", "audio", "archive", "other"] },
  dimensions: { width: Number, height: Number },
  altText: String, description: String, tags: [String],
  version: { type: Number, default: 1 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  usage: [{ refModel: String, refId: mongoose.Schema.Types.ObjectId, usedAt: Date }],
  isDeleted: Boolean, deletedAt: Date, deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 33. MediaFileVersion
generateFile('MediaFileVersion', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  mediaFile: { type: mongoose.Schema.Types.ObjectId, ref: "MediaFile" },
  versionNumber: Number,
  originalName: String, storedName: String, filePath: String, fileUrl: String,
  size: Number, mimeType: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 34. Budget
generateFile('Budget', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  budgetNumber: { type: String, unique: true },
  title: String, description: String,
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  totalAmount: Number, spentAmount: { type: Number, default: 0 }, remainingAmount: Number,
  currency: { type: String, default: "INR" },
  fiscalYear: String, month: Number,
  status: { type: String, enum: ["draft", "submitted", "approved", "rejected", "active", "closed"], default: "draft" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, approvedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 35. BudgetCategory
generateFile('BudgetCategory', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  budget: { type: mongoose.Schema.Types.ObjectId, ref: "Budget" },
  name: String, allocatedAmount: Number, spentAmount: { type: Number, default: 0 }, remainingAmount: Number
}`);

// 36. Expense
generateFile('Expense', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  expenseNumber: { type: String, unique: true },
  budget: { type: mongoose.Schema.Types.ObjectId, ref: "Budget" },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "BudgetCategory" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  title: String, description: String,
  amount: Number, currency: { type: String, default: "INR" },
  paymentDate: Date, paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
  receiptFile: { fileName: String, filePath: String, fileUrl: String },
  status: { type: String, enum: ["pending", "submitted", "approved", "rejected", "paid"], default: "pending" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, approvedAt: Date,
  rejectionReason: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 37. Timesheet
generateFile('Timesheet', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  date: Date, hours: Number, minutes: Number, description: String,
  source: { type: String, enum: ["manual", "timer"], default: "manual" },
  timer: { type: mongoose.Schema.Types.ObjectId, ref: "TaskTimer" },
  status: { type: String, enum: ["draft", "submitted", "approved", "rejected"], default: "draft" },
  submittedAt: Date, approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, approvedAt: Date, rejectionReason: String
}`);

// 38. TimesheetApproval
generateFile('TimesheetApproval', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  weekStartDate: Date, weekEndDate: Date, totalHours: Number,
  entries: [{ type: mongoose.Schema.Types.ObjectId, ref: "Timesheet" }],
  status: { type: String, enum: ["submitted", "approved", "rejected"], default: "submitted" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, approvedAt: Date, comments: String
}`);

// 39. Notification
generateFile('Notification', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { type: String, enum: ["task_assigned", "task_updated", "task_overdue", "task_commented", "mention", "meeting_scheduled", "mom_created", "mom_signed", "sla_breach", "budget_alert", "expense_approved", "announcement", "system"] },
  title: String, message: String, refModel: String, refId: mongoose.Schema.Types.ObjectId, actionUrl: String,
  channels: { inApp: Boolean, email: Boolean, slack: Boolean, telegram: Boolean },
  isRead: { type: Boolean, default: false }, readAt: Date
}`);

// 40. EmailTemplate
generateFile('EmailTemplate', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String,
  event: { type: String, enum: ["email_verification", "forgot_password", "workspace_invitation", "task_assignment", "task_overdue", "meeting_scheduled", "mom_created", "mom_signed", "sla_breach", "daily_digest", "budget_approved", "expense_approved"] },
  subject: String, htmlBody: String, textBody: String, variables: [String],
  isSystem: Boolean, isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 41. NotificationTemplate
generateFile('NotificationTemplate', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String, event: String,
  channel: { type: String, enum: ["in_app", "slack", "telegram"] },
  titleTemplate: String, bodyTemplate: String, variables: [String],
  isActive: Boolean
}`);

// 42. Report
generateFile('Report', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  reportNumber: { type: String, unique: true },
  title: String,
  reportType: { type: String, enum: ["task", "project", "tracker", "user", "department", "sla", "budget", "timesheet", "custom"] },
  filters: { dateFrom: Date, dateTo: Date, user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" }, project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" }, status: String, priority: String },
  generatedFile: { pdfPath: String, excelPath: String },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 43. DashboardWidgetConfig
generateFile('DashboardWidgetConfig', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  widgets: [{ widgetKey: String, title: String, isVisible: Boolean, order: Number, size: { w: Number, h: Number }, position: { x: Number, y: Number }, settings: { type: Map, of: mongoose.Schema.Types.Mixed } }]
}`);

// 44. Note
generateFile('Note', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  title: String, content: String, contentHtml: String, tags: [String], folder: String,
  linkedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
  linkedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
  visibility: { type: String, enum: ["private", "shared", "workspace"], default: "private" },
  sharedWith: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, permission: { type: String, enum: ["view", "edit"] } }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 45. WikiPage
generateFile('WikiPage', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  title: String, slug: String, content: String, contentHtml: String,
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  parentPage: { type: mongoose.Schema.Types.ObjectId, ref: "WikiPage" },
  tags: [String],
  visibility: { type: String, enum: ["workspace", "department", "restricted"], default: "workspace" },
  allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  version: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 46. WikiPageVersion
generateFile('WikiPageVersion', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  page: { type: mongoose.Schema.Types.ObjectId, ref: "WikiPage" },
  versionNumber: Number, title: String, content: String, contentHtml: String,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  changeSummary: String
}`, false);

// 47. ApprovalChain
generateFile('ApprovalChain', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String,
  appliesTo: { module: { type: String, enum: ["task", "budget", "expense", "mom", "intake"] }, taskCategory: String, deliverableType: String },
  steps: [{ order: Number, approverType: { type: String, enum: ["user", "role", "department_head", "project_manager"] }, user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, role: String, department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" }, isRequired: Boolean }],
  isActive: Boolean, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 48. ApprovalRequest
generateFile('ApprovalRequest', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  approvalChain: { type: mongoose.Schema.Types.ObjectId, ref: "ApprovalChain" },
  refModel: String, refId: mongoose.Schema.Types.ObjectId, currentStepOrder: Number,
  status: { type: String, enum: ["pending", "approved", "rejected", "cancelled"], default: "pending" },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  finalApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, finalApprovedAt: Date,
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, rejectedAt: Date, rejectionReason: String
}`);

// 49. ApprovalStep
generateFile('ApprovalStep', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  approvalRequest: { type: mongoose.Schema.Types.ObjectId, ref: "ApprovalRequest" },
  order: Number, approver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "approved", "rejected", "skipped"], default: "pending" },
  comments: String, actedAt: Date
}`);

// 50. Campaign
generateFile('Campaign', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  campaignNumber: String, name: String, description: String,
  campaignType: { type: String, enum: ["social_media", "email", "event", "product_launch", "brand", "other"] },
  startDate: Date, endDate: Date, budget: { type: mongoose.Schema.Types.ObjectId, ref: "Budget" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, enum: ["planning", "active", "completed", "cancelled"], default: "planning" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 51. ContentCalendarPost
generateFile('ContentCalendarPost', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign" },
  title: String, caption: String,
  platform: { type: String, enum: ["facebook", "instagram", "linkedin", "twitter", "youtube", "other"] },
  scheduledDate: Date, publishedDate: Date,
  creativeFile: { type: mongoose.Schema.Types.ObjectId, ref: "MediaFile" },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["idea", "draft", "designed", "review", "approved", "published", "cancelled"], default: "idea" },
  hashtags: [String], remarks: String, task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 52. Vendor
generateFile('Vendor', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String, vendorType: { type: String, enum: ["printing", "design", "event", "digital", "production", "other"] },
  contactPerson: String, phone: String, email: String, address: String, services: [String],
  rateCard: [{ serviceName: String, unit: String, rate: Number, currency: { type: String, default: "INR" } }],
  rating: Number, notes: String, isActive: Boolean, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 53. PrintJob
generateFile('PrintJob', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
  printJobNumber: String, itemName: String, paperType: String, quantity: Number, size: String, colorType: String,
  samplePrintDate: Date, sampleApprovedDate: Date, finalPrintDate: Date,
  costPerPiece: Number, totalCost: Number,
  status: { type: String, enum: ["planned", "sample_print", "sample_approved", "final_print", "delivered", "cancelled"], default: "planned" },
  remarks: String, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 54. SystemSettings
generateFile('SystemSettings', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  system: { appName: String, defaultLanguage: String, timezone: String, dateFormat: String, timeFormat: String, calendarStartDay: String, emailVerificationRequired: Boolean, forceTwoFactorAuth: Boolean },
  brand: { darkLogo: String, lightLogo: String, favicon: String, primaryColor: String, secondaryColor: String, fontFamily: String, companyName: String },
  email: { provider: { type: String, enum: ["smtp", "sendgrid", "mailgun"], default: "smtp" }, smtpHost: String, smtpPort: Number, smtpUser: String, smtpPasswordEncrypted: String, fromAddress: String, fromName: String, encryption: { type: String, enum: ["none", "ssl", "tls"] } },
  emailNotifications: { workspaceInvitation: Boolean, taskAssignment: Boolean, taskOverdue: Boolean, taskComment: Boolean, meetingScheduled: Boolean, momCreated: Boolean, momSigned: Boolean, slaBreach: Boolean, budgetApproval: Boolean, expenseApproval: Boolean, dailyDigest: Boolean },
  storage: { provider: { type: String, enum: ["local"], default: "local" }, uploadPath: String, maxFileSizeMB: Number, allowedFileTypes: [String] },
  slack: { enabled: Boolean, webhookUrlEncrypted: String, defaultChannel: String },
  telegram: { enabled: Boolean, botTokenEncrypted: String, chatId: String },
  googleOAuth: { enabled: Boolean, clientId: String, clientSecretEncrypted: String, callbackUrl: String },
  zoom: { enabled: Boolean, accountId: String, clientId: String, clientSecretEncrypted: String },
  googleMeet: { enabled: Boolean, credentialsJsonEncrypted: String },
  recaptcha: { enabled: Boolean, siteKey: String, secretKeyEncrypted: String },
  chatGPT: { enabled: Boolean, apiKeyEncrypted: String, model: String, maxTokens: Number },
  seo: { metaTitle: String, metaDescription: String, googleAnalyticsId: String, googleTagManagerId: String },
  ipWhitelist: { enabled: Boolean, allowedIps: [String] },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 55. ActivityLog
generateFile('ActivityLog', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String, module: String, refModel: String, refId: mongoose.Schema.Types.ObjectId,
  description: String, oldValue: mongoose.Schema.Types.Mixed, newValue: mongoose.Schema.Types.Mixed,
  ipAddress: String, userAgent: String
}`, false);

// 56. Announcement
generateFile('Announcement', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  title: String, message: String,
  type: { type: String, enum: ["info", "success", "warning", "urgent"], default: "info" },
  visibleFrom: Date, visibleUntil: Date,
  targetAudience: { type: String, enum: ["all", "department", "role", "specific_users"], default: "all" },
  departments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Department" }],
  roles: [String], users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isActive: Boolean, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 57. Feedback
generateFile('Feedback', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  givenBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  givenTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number, min: 1, max: 5 },
  qualityRating: Number, timelinessRating: Number, communicationRating: Number,
  comment: String
}`, false);

// 58. APIKey
generateFile('APIKey', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String, keyHash: String,
  permissions: [{ module: String, actions: [String] }],
  lastUsedAt: Date, expiresAt: Date, isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 59. Backup
generateFile('Backup', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  backupType: { type: String, enum: ["manual", "scheduled"] },
  filePath: String, fileUrl: String, dbDumpPath: String, uploadsZipPath: String,
  size: Number,
  status: { type: String, enum: ["processing", "completed", "failed"], default: "processing" },
  errorMessage: String, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`, false);

// 60. Changelog
generateFile('Changelog', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  version: String, title: String, description: String,
  changes: [{ type: { type: String, enum: ["feature", "improvement", "bugfix", "security"] }, text: String }],
  publishedAt: Date, publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isActive: Boolean
}`);

// 61. HelpArticle
generateFile('HelpArticle', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  title: String, slug: String, category: String, content: String, contentHtml: String,
  tags: [String], order: Number, isPublished: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}`);

// 62. AIRequestLog
generateFile('AIRequestLog', `{
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  feature: { type: String, enum: ["task_description", "mom_summary", "report_insight", "smart_reply", "duplicate_task_detection"] },
  prompt: String, response: String, model: String, tokensUsed: Number,
  refModel: String, refId: mongoose.Schema.Types.ObjectId,
  status: { type: String, enum: ["success", "failed"], default: "success" },
  errorMessage: String
}`, false);

console.log('Successfully generated all 62 schemas.');
