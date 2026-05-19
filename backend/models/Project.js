const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  projectNumber: { type: String },
  title: { type: String, required: true },
  projectCode: { type: String },
  slug: String,
  description: String,
  objective: String,
  projectType: {
    type: String,
    enum: ["catalogue", "brochure", "flyer", "social_media_campaign", "email_campaign", "website_update", "event", "product_launch", "branding", "print", "video", "presentation", "other"],
    default: "other"
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  requestingDepartment: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  owningDepartment: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: { type: String, enum: ["project_manager", "designer", "content_writer", "reviewer", "approver", "coordinator", "viewer", "other"], default: "other" },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    addedAt: Date,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  }],
  status: { type: String, enum: ["draft", "planning", "active", "on_hold", "completed", "cancelled", "archived"], default: "planning" },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  startDate: Date, dueDate: Date, completedAt: Date, cancelledAt: Date, cancellationReason: String, holdReason: String,
  progressPercent: { type: Number, default: 0 },
  taskSummary: {
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    pendingTasks: { type: Number, default: 0 },
    delayedTasks: { type: Number, default: 0 }
  },
  milestoneSummary: {
    totalMilestones: { type: Number, default: 0 },
    completedMilestones: { type: Number, default: 0 },
    delayedMilestones: { type: Number, default: 0 }
  },
  tags: [String],
  budget: { type: mongoose.Schema.Types.ObjectId, ref: "Budget" },
  estimatedBudget: Number,
  actualSpend: { type: Number, default: 0 },
  currency: { type: String, default: "INR" },
  linkedIntakeForms: [{ type: mongoose.Schema.Types.ObjectId, ref: "IntakeForm" }],
  linkedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
  linkedMeetings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Meeting" }],
  linkedMOMs: [{ type: mongoose.Schema.Types.ObjectId, ref: "MOM" }],
  linkedMediaFiles: [{ type: mongoose.Schema.Types.ObjectId, ref: "MediaFile" }],
  customFields: { type: Map, of: mongoose.Schema.Types.Mixed },
  visibility: { type: String, enum: ["workspace", "department", "members_only", "private"], default: "workspace" },
  isPinned: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

schema.index({ workspace: 1, projectNumber: 1 }, { unique: true, sparse: true });
schema.index({ workspace: 1, projectCode: 1 }, { unique: true, sparse: true });
schema.index({ workspace: 1, status: 1 });
schema.index({ workspace: 1, manager: 1 });
schema.index({ workspace: 1, dueDate: 1 });
schema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.models.Project || mongoose.model('Project', schema);
