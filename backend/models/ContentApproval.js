const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  contentItem: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentItem', required: true },
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'changes_requested'], default: 'pending' },
  comment: String,
  respondedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

schema.index({ workspace: 1, contentItem: 1 });

module.exports = mongoose.models.ContentApproval || mongoose.model('ContentApproval', schema);
