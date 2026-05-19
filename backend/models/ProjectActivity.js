const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', index: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
  action: {
    type: String,
    enum: ['created', 'updated', 'status_changed', 'member_added', 'member_removed', 'task_added', 'task_completed', 'milestone_added', 'milestone_completed', 'meeting_linked', 'mom_linked', 'media_linked', 'budget_linked', 'archived', 'restored', 'deleted']
  },
  message: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: { createdAt: true, updatedAt: false } });

schema.index({ workspace: 1, createdAt: -1 });
schema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.models.ProjectActivity || mongoose.model('ProjectActivity', schema);
