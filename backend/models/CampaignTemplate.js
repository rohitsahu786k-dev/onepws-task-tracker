const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  name: { type: String, required: true },
  campaignType: String,
  description: String,
  defaultObjective: String,
  defaultPlatforms: [String],
  defaultDurationDays: Number,
  defaultContentItems: [{
    title: String,
    contentType: String,
    platforms: [String],
    offsetDays: Number,
    brief: String,
    assignedRole: String
  }],
  defaultTasks: [{ title: String, offsetDays: Number, assignedRole: String, priority: String }],
  defaultKpis: Object,
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

schema.index({ workspace: 1, isActive: 1 });

module.exports = mongoose.models.CampaignTemplate || mongoose.model('CampaignTemplate', schema);
