const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  printJob: { type: mongoose.Schema.Types.ObjectId, ref: 'PrintJob', required: true },
  checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  checkedAt: Date,
  quantityReceived: Number,
  quantityAccepted: Number,
  quantityRejected: Number,
  qualityParameters: {
    colorAccuracy: { type: String, enum: ['pass', 'fail', 'minor_issue'], default: 'pass' },
    paperQuality: { type: String, enum: ['pass', 'fail', 'minor_issue'], default: 'pass' },
    cuttingAccuracy: { type: String, enum: ['pass', 'fail', 'minor_issue'], default: 'pass' },
    finishingQuality: { type: String, enum: ['pass', 'fail', 'minor_issue'], default: 'pass' },
    bindingQuality: { type: String, enum: ['pass', 'fail', 'minor_issue'], default: 'pass' },
    packagingQuality: { type: String, enum: ['pass', 'fail', 'minor_issue'], default: 'pass' }
  },
  issues: [{ issueType: String, description: String, severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' }, photos: [{ mediaFile: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaFile' }, fileName: String }] }],
  finalStatus: { type: String, enum: ['accepted', 'partially_accepted', 'rejected', 'reprint_required'], default: 'accepted' },
  remarks: String
}, { timestamps: true });

schema.index({ workspace: 1, printJob: 1 });
schema.index({ workspace: 1, finalStatus: 1 });

module.exports = mongoose.models.PrintQualityCheck || mongoose.model('PrintQualityCheck', schema);
