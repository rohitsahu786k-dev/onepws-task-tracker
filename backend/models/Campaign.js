const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  campaignNumber: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  slug: String,
  description: String,
  campaignType: { type: String, enum: ["product_launch", "brand_awareness", "lead_generation", "event_promotion", "festive", "social_media", "email", "website", "dealer", "internal", "recruitment", "pr", "other"], default: "other" },
  objective: String,
  targetAudience: String,
  platforms: [String],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  launchDate: Date,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  teamMembers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: { type: String, enum: ["manager", "designer", "content_writer", "approver", "publisher", "analyst", "member"], default: "member" }
  }],
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  budget: { type: mongoose.Schema.Types.ObjectId, ref: "Budget" },
  estimatedBudget: { type: Number, default: 0 },
  actualSpend: { type: Number, default: 0 },
  goals: [{ metric: String, targetValue: Number, unit: String }],
  kpis: {
    impressionsTarget: Number,
    reachTarget: Number,
    engagementTarget: Number,
    leadsTarget: Number,
    clicksTarget: Number,
    conversionsTarget: Number
  },
  performance: {
    impressions: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    leads: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    roi: { type: Number, default: 0 }
  },
  status: { type: String, enum: ["draft", "planned", "active", "on_hold", "completed", "cancelled", "archived"], default: "draft" },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  tags: [String],
  attachments: [{
    mediaFile: { type: mongoose.Schema.Types.ObjectId, ref: "MediaFile" },
    fileName: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    uploadedAt: Date
  }],
  notes: String,
  approval: {
    request: { type: mongoose.Schema.Types.ObjectId, ref: "ApprovalRequest" },
    status: { type: String, enum: ["not_required", "pending", "approved", "rejected", "changes_requested"], default: "not_required" }
  },
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

schema.index({ workspace: 1, campaignNumber: 1 }, { unique: true });
schema.index({ workspace: 1, status: 1 });
schema.index({ workspace: 1, campaignType: 1 });
schema.index({ workspace: 1, startDate: 1 });
schema.index({ workspace: 1, endDate: 1 });
schema.index({ workspace: 1, owner: 1 });
schema.index({ workspace: 1, department: 1 });
schema.index({ workspace: 1, project: 1 });

module.exports = mongoose.models.Campaign || mongoose.model('Campaign', schema);
