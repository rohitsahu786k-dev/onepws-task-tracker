const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  impressions: { type: Number, default: 0 },
  reach: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  leads: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  spend: { type: Number, default: 0 },
  engagementRate: { type: Number, default: 0 }
}, { _id: false });

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  contentNumber: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  contentType: { type: String, enum: ['social_post', 'reel', 'video', 'blog', 'email', 'whatsapp_creative', 'website_banner', 'landing_page', 'brochure', 'flyer', 'catalogue', 'ad_creative', 'event_creative', 'press_release', 'internal_announcement', 'other'], default: 'social_post' },
  platforms: [String],
  scheduledDate: { type: Date, required: true },
  scheduledTime: String,
  publishDateTime: Date,
  timezone: { type: String, default: 'Asia/Kolkata' },
  brief: String,
  caption: String,
  hashtags: [String],
  callToAction: String,
  targetUrl: String,
  targetAudience: String,
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  contentOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  designer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  contentWriter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  publisher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  linkedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  mediaFiles: [{
    mediaFile: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaFile' },
    usage: { type: String, enum: ['creative', 'reference', 'final', 'thumbnail', 'attachment'], default: 'creative' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: Date
  }],
  approval: {
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalRequest' },
    status: { type: String, enum: ['not_required', 'pending', 'approved', 'rejected', 'changes_requested'], default: 'not_required' },
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: String
  },
  status: { type: String, enum: ['idea', 'brief_ready', 'in_design', 'copy_ready', 'review', 'approved', 'scheduled', 'published', 'cancelled', 'archived'], default: 'idea' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  performance: { type: performanceSchema, default: () => ({}) },
  publishedLinks: [{ platform: String, url: String, publishedAt: Date }],
  calendarEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'CalendarEvent' },
  notes: String,
  tags: [String],
  isRecurring: { type: Boolean, default: false },
  recurringRule: String,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

schema.index({ workspace: 1, contentNumber: 1 }, { unique: true });
schema.index({ workspace: 1, campaign: 1 });
schema.index({ workspace: 1, scheduledDate: 1 });
schema.index({ workspace: 1, publishDateTime: 1 });
schema.index({ workspace: 1, status: 1 });
schema.index({ workspace: 1, contentType: 1 });
schema.index({ workspace: 1, platforms: 1 });
schema.index({ workspace: 1, assignedTo: 1 });

module.exports = mongoose.models.ContentItem || mongoose.model('ContentItem', schema);
