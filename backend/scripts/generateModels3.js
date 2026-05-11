const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../models');
const models = {};

// 31. MediaFolder
models['MediaFolder.js'] = `const mongoose = require('mongoose');
const mediaFolderSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String,
  parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: "MediaFolder" },
  path: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
module.exports = mongoose.model('MediaFolder', mediaFolderSchema);
`;

// 32. MediaFile
models['MediaFile.js'] = `const mongoose = require('mongoose');
const mediaFileSchema = new mongoose.Schema({
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
}, { timestamps: true });
mediaFileSchema.index({ workspace: 1, folder: 1 });
mediaFileSchema.index({ workspace: 1, fileCategory: 1 });
mediaFileSchema.index({ originalName: 'text' });
mediaFileSchema.index({ tags: 1 });
module.exports = mongoose.model('MediaFile', mediaFileSchema);
`;

// 33. MediaFileVersion
models['MediaFileVersion.js'] = `const mongoose = require('mongoose');
const mediaFileVersionSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  mediaFile: { type: mongoose.Schema.Types.ObjectId, ref: "MediaFile" },
  versionNumber: Number, originalName: String, storedName: String, filePath: String, fileUrl: String,
  size: Number, mimeType: String, uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('MediaFileVersion', mediaFileVersionSchema);
`;

// 34. Budget
models['Budget.js'] = `const mongoose = require('mongoose');
const budgetSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  budgetNumber: { type: String, unique: true },
  title: String, description: String,
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  totalAmount: Number, spentAmount: { type: Number, default: 0 }, remainingAmount: Number,
  currency: { type: String, default: "INR" }, fiscalYear: String, month: Number,
  status: { type: String, enum: ["draft", "submitted", "approved", "rejected", "active", "closed"], default: "draft" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, approvedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
budgetSchema.index({ workspace: 1, budgetNumber: 1 }, { unique: true });
budgetSchema.index({ workspace: 1, project: 1 });
budgetSchema.index({ workspace: 1, department: 1 });
module.exports = mongoose.model('Budget', budgetSchema);
`;

// 35. BudgetCategory
models['BudgetCategory.js'] = `const mongoose = require('mongoose');
const budgetCategorySchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  budget: { type: mongoose.Schema.Types.ObjectId, ref: "Budget" },
  name: String, allocatedAmount: Number, spentAmount: { type: Number, default: 0 }, remainingAmount: Number
}, { timestamps: true });
module.exports = mongoose.model('BudgetCategory', budgetCategorySchema);
`;

// 36. Expense
models['Expense.js'] = `const mongoose = require('mongoose');
const expenseSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  expenseNumber: { type: String, unique: true },
  budget: { type: mongoose.Schema.Types.ObjectId, ref: "Budget" },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "BudgetCategory" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  title: String, description: String, amount: Number, currency: { type: String, default: "INR" },
  paymentDate: Date, paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
  receiptFile: { fileName: String, filePath: String, fileUrl: String },
  status: { type: String, enum: ["pending", "submitted", "approved", "rejected", "paid"], default: "pending" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, approvedAt: Date, rejectionReason: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
expenseSchema.index({ workspace: 1, expenseNumber: 1 }, { unique: true });
expenseSchema.index({ workspace: 1, budget: 1 });
expenseSchema.index({ workspace: 1, status: 1 });
module.exports = mongoose.model('Expense', expenseSchema);
`;

// 37. Timesheet
models['Timesheet.js'] = `const mongoose = require('mongoose');
const timesheetSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  date: Date, hours: Number, minutes: Number, description: String,
  source: { type: String, enum: ["manual", "timer"], default: "manual" },
  timer: { type: mongoose.Schema.Types.ObjectId, ref: "TaskTimer" },
  status: { type: String, enum: ["draft", "submitted", "approved", "rejected"], default: "draft" },
  submittedAt: Date, approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, approvedAt: Date, rejectionReason: String
}, { timestamps: true });
module.exports = mongoose.model('Timesheet', timesheetSchema);
`;

// 38. TimesheetApproval
models['TimesheetApproval.js'] = `const mongoose = require('mongoose');
const timesheetApprovalSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  weekStartDate: Date, weekEndDate: Date, totalHours: Number,
  entries: [{ type: mongoose.Schema.Types.ObjectId, ref: "Timesheet" }],
  status: { type: String, enum: ["submitted", "approved", "rejected"], default: "submitted" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, approvedAt: Date, comments: String
}, { timestamps: true });
module.exports = mongoose.model('TimesheetApproval', timesheetApprovalSchema);
`;

// 39. Notification
models['Notification.js'] = `const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { type: String, enum: ["task_assigned", "task_updated", "task_overdue", "task_commented", "mention", "meeting_scheduled", "mom_created", "mom_signed", "sla_breach", "budget_alert", "expense_approved", "announcement", "system"] },
  title: String, message: String, refModel: String, refId: mongoose.Schema.Types.ObjectId, actionUrl: String,
  channels: { inApp: Boolean, email: Boolean, slack: Boolean, telegram: Boolean },
  isRead: { type: Boolean, default: false }, readAt: Date
}, { timestamps: true });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ workspace: 1, createdAt: 1 });
module.exports = mongoose.model('Notification', notificationSchema);
`;

// 40. EmailTemplate
models['EmailTemplate.js'] = `const mongoose = require('mongoose');
const emailTemplateSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String,
  event: { type: String, enum: ["email_verification", "forgot_password", "workspace_invitation", "task_assignment", "task_overdue", "meeting_scheduled", "mom_created", "mom_signed", "sla_breach", "daily_digest", "budget_approved", "expense_approved"] },
  subject: String, htmlBody: String, textBody: String, variables: [String],
  isSystem: Boolean, isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
`;

// 41. NotificationTemplate
models['NotificationTemplate.js'] = `const mongoose = require('mongoose');
const notificationTemplateSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String, event: String,
  channel: { type: String, enum: ["in_app", "slack", "telegram"] },
  titleTemplate: String, bodyTemplate: String, variables: [String],
  isActive: Boolean
}, { timestamps: true });
module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema);
`;

// 42. Report
models['Report.js'] = `const mongoose = require('mongoose');
const reportSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  reportNumber: { type: String, unique: true },
  title: String,
  reportType: { type: String, enum: ["task", "project", "tracker", "user", "department", "sla", "budget", "timesheet", "custom"] },
  filters: { dateFrom: Date, dateTo: Date, user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" }, project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" }, status: String, priority: String },
  generatedFile: { pdfPath: String, excelPath: String },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Report', reportSchema);
`;

// 43. DashboardWidgetConfig
models['DashboardWidgetConfig.js'] = `const mongoose = require('mongoose');
const dashboardWidgetConfigSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  widgets: [{ widgetKey: String, title: String, isVisible: Boolean, order: Number, size: { w: Number, h: Number }, position: { x: Number, y: Number }, settings: { type: Map, of: mongoose.Schema.Types.Mixed } }]
}, { timestamps: true });
module.exports = mongoose.model('DashboardWidgetConfig', dashboardWidgetConfigSchema);
`;

// 44. Note
models['Note.js'] = `const mongoose = require('mongoose');
const noteSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  title: String, content: String, contentHtml: String, tags: [String], folder: String,
  linkedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
  linkedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
  visibility: { type: String, enum: ["private", "shared", "workspace"], default: "private" },
  sharedWith: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, permission: { type: String, enum: ["view", "edit"] } }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
module.exports = mongoose.model('Note', noteSchema);
`;

// 45. WikiPage
models['WikiPage.js'] = `const mongoose = require('mongoose');
const wikiPageSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  title: String, slug: String, content: String, contentHtml: String,
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  parentPage: { type: mongoose.Schema.Types.ObjectId, ref: "WikiPage" },
  tags: [String],
  visibility: { type: String, enum: ["workspace", "department", "restricted"], default: "workspace" },
  allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  version: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
module.exports = mongoose.model('WikiPage', wikiPageSchema);
`;

// 46. WikiPageVersion
models['WikiPageVersion.js'] = `const mongoose = require('mongoose');
const wikiPageVersionSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  page: { type: mongoose.Schema.Types.ObjectId, ref: "WikiPage" },
  versionNumber: Number, title: String, content: String, contentHtml: String,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, changeSummary: String,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('WikiPageVersion', wikiPageVersionSchema);
`;

// 47. ApprovalChain
models['ApprovalChain.js'] = `const mongoose = require('mongoose');
const approvalChainSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String,
  appliesTo: { module: { type: String, enum: ["task", "budget", "expense", "mom", "intake"] }, taskCategory: String, deliverableType: String },
  steps: [{ order: Number, approverType: { type: String, enum: ["user", "role", "department_head", "project_manager"] }, user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, role: String, department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" }, isRequired: Boolean }],
  isActive: Boolean, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
module.exports = mongoose.model('ApprovalChain', approvalChainSchema);
`;

// 48. ApprovalRequest
models['ApprovalRequest.js'] = `const mongoose = require('mongoose');
const approvalRequestSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  approvalChain: { type: mongoose.Schema.Types.ObjectId, ref: "ApprovalChain" },
  refModel: String, refId: mongoose.Schema.Types.ObjectId, currentStepOrder: Number,
  status: { type: String, enum: ["pending", "approved", "rejected", "cancelled"], default: "pending" },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  finalApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, finalApprovedAt: Date,
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, rejectedAt: Date, rejectionReason: String
}, { timestamps: true });
module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);
`;

// 49. ApprovalStep
models['ApprovalStep.js'] = `const mongoose = require('mongoose');
const approvalStepSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  approvalRequest: { type: mongoose.Schema.Types.ObjectId, ref: "ApprovalRequest" },
  order: Number, approver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "approved", "rejected", "skipped"], default: "pending" },
  comments: String, actedAt: Date
}, { timestamps: true });
module.exports = mongoose.model('ApprovalStep', approvalStepSchema);
`;

// 50. Campaign
models['Campaign.js'] = `const mongoose = require('mongoose');
const campaignSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  campaignNumber: String, name: String, description: String,
  campaignType: { type: String, enum: ["social_media", "email", "event", "product_launch", "brand", "other"] },
  startDate: Date, endDate: Date, budget: { type: mongoose.Schema.Types.ObjectId, ref: "Budget" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, enum: ["planning", "active", "completed", "cancelled"], default: "planning" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
module.exports = mongoose.model('Campaign', campaignSchema);
`;

// 51. ContentCalendarPost
models['ContentCalendarPost.js'] = `const mongoose = require('mongoose');
const contentCalendarPostSchema = new mongoose.Schema({
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
}, { timestamps: true });
module.exports = mongoose.model('ContentCalendarPost', contentCalendarPostSchema);
`;

// 52. Vendor
models['Vendor.js'] = `const mongoose = require('mongoose');
const vendorSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String,
  vendorType: { type: String, enum: ["printing", "design", "event", "digital", "production", "other"] },
  contactPerson: String, phone: String, email: String, address: String, services: [String],
  rateCard: [{ serviceName: String, unit: String, rate: Number, currency: { type: String, default: "INR" } }],
  rating: Number, notes: String, isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
module.exports = mongoose.model('Vendor', vendorSchema);
`;

// 53. PrintJob
models['PrintJob.js'] = `const mongoose = require('mongoose');
const printJobSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
  printJobNumber: String, itemName: String, paperType: String, quantity: Number, size: String, colorType: String,
  samplePrintDate: Date, sampleApprovedDate: Date, finalPrintDate: Date,
  costPerPiece: Number, totalCost: Number,
  status: { type: String, enum: ["planned", "sample_print", "sample_approved", "final_print", "delivered", "cancelled"], default: "planned" },
  remarks: String, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
module.exports = mongoose.model('PrintJob', printJobSchema);
`;

// 55. ActivityLog
models['ActivityLog.js'] = `const mongoose = require('mongoose');
const activityLogSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String, module: String, refModel: String, refId: mongoose.Schema.Types.ObjectId,
  description: String, oldValue: mongoose.Schema.Types.Mixed, newValue: mongoose.Schema.Types.Mixed,
  ipAddress: String, userAgent: String, createdAt: { type: Date, default: Date.now }
});
activityLogSchema.index({ workspace: 1, user: 1 });
activityLogSchema.index({ workspace: 1, module: 1 });
activityLogSchema.index({ workspace: 1, createdAt: 1 });
module.exports = mongoose.model('ActivityLog', activityLogSchema);
`;

// 56. Announcement
models['Announcement.js'] = `const mongoose = require('mongoose');
const announcementSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  title: String, message: String,
  type: { type: String, enum: ["info", "success", "warning", "urgent"], default: "info" },
  visibleFrom: Date, visibleUntil: Date,
  targetAudience: { type: String, enum: ["all", "department", "role", "specific_users"], default: "all" },
  departments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Department" }],
  roles: [String], users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isActive: Boolean, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
module.exports = mongoose.model('Announcement', announcementSchema);
`;

// 57. Feedback
models['Feedback.js'] = `const mongoose = require('mongoose');
const feedbackSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  givenBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  givenTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number, min: 1, max: 5 },
  qualityRating: Number, timelinessRating: Number, communicationRating: Number,
  comment: String, createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Feedback', feedbackSchema);
`;

// 58. ApiKey
models['ApiKey.js'] = `const mongoose = require('mongoose');
const apiKeySchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String, keyHash: String,
  permissions: [{ module: String, actions: [String] }],
  lastUsedAt: Date, expiresAt: Date, isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
module.exports = mongoose.model('ApiKey', apiKeySchema);
`;

// 59. Backup
models['Backup.js'] = `const mongoose = require('mongoose');
const backupSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  backupType: { type: String, enum: ["manual", "scheduled"] },
  filePath: String, fileUrl: String, dbDumpPath: String, uploadsZipPath: String,
  size: Number, status: { type: String, enum: ["processing", "completed", "failed"], default: "processing" },
  errorMessage: String, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Backup', backupSchema);
`;

// 60. Changelog
models['Changelog.js'] = `const mongoose = require('mongoose');
const changelogSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  version: String, title: String, description: String,
  changes: [{ type: { type: String, enum: ["feature", "improvement", "bugfix", "security"] }, text: String }],
  publishedAt: Date, publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isActive: Boolean
}, { timestamps: true });
module.exports = mongoose.model('Changelog', changelogSchema);
`;

// 61. HelpArticle
models['HelpArticle.js'] = `const mongoose = require('mongoose');
const helpArticleSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  title: String, slug: String, category: String, content: String, contentHtml: String,
  tags: [String], order: Number, isPublished: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
module.exports = mongoose.model('HelpArticle', helpArticleSchema);
`;

// 62. AIRequestLog
models['AIRequestLog.js'] = `const mongoose = require('mongoose');
const aiRequestLogSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  feature: { type: String, enum: ["task_description", "mom_summary", "report_insight", "smart_reply", "duplicate_task_detection"] },
  prompt: String, response: String, model: String, tokensUsed: Number,
  refModel: String, refId: mongoose.Schema.Types.ObjectId,
  status: { type: String, enum: ["success", "failed"], default: "success" },
  errorMessage: String, createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('AIRequestLog', aiRequestLogSchema);
`;

for (const [filename, content] of Object.entries(models)) {
  fs.writeFileSync(path.join(__dirname, '../models', filename), content);
}
console.log('Batch 3 models generated.');
