const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  contentItem: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentItem', required: true },
  platform: String,
  metrics: Object,
  recordedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

schema.index({ workspace: 1, contentItem: 1, recordedAt: -1 });

module.exports = mongoose.models.ContentPerformance || mongoose.model('ContentPerformance', schema);
