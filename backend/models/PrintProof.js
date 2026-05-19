const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  printJob: { type: mongoose.Schema.Types.ObjectId, ref: 'PrintJob', required: true },
  proofNumber: { type: String, required: true },
  proofType: { type: String, enum: ['digital_proof', 'hard_copy_sample', 'color_proof', 'final_proof', 'machine_proof'], default: 'digital_proof' },
  version: { type: Number, default: 1 },
  proofFile: { mediaFile: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaFile' }, fileName: String },
  sampleReceivedDate: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'changes_required'], default: 'pending' },
  reviewComments: String,
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  changesRequired: [{ point: String, priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }, resolved: { type: Boolean, default: false } }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

schema.index({ workspace: 1, proofNumber: 1 }, { unique: true });
schema.index({ workspace: 1, printJob: 1 });
schema.index({ workspace: 1, reviewStatus: 1 });

module.exports = mongoose.models.PrintProof || mongoose.model('PrintProof', schema);
