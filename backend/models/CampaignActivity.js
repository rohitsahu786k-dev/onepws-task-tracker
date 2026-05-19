const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  contentItem: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentItem' },
  action: { type: String, enum: ['campaign_created', 'campaign_updated', 'campaign_started', 'campaign_completed', 'campaign_cancelled', 'content_created', 'content_updated', 'content_assigned', 'content_submitted_for_approval', 'content_approved', 'content_rejected', 'content_scheduled', 'content_published', 'performance_updated', 'media_attached', 'task_created', 'calendar_event_created', 'approval_requested'] },
  message: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: { createdAt: true, updatedAt: false } });

schema.index({ workspace: 1, campaign: 1, createdAt: -1 });
schema.index({ workspace: 1, contentItem: 1, createdAt: -1 });

module.exports = mongoose.models.CampaignActivity || mongoose.model('CampaignActivity', schema);
