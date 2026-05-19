const mongoose = require('mongoose');

const { Schema } = mongoose;

const budgetRevisionSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    budget: { type: Schema.Types.ObjectId, ref: 'Budget', required: true },
    oldAmount: Number,
    newAmount: Number,
    differenceAmount: Number,
    revisionType: { type: String, enum: ['increase', 'decrease', 'category_adjustment'], required: true },
    reason: { type: String, required: true },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    rejectionReason: String,
  },
  { timestamps: true }
);

budgetRevisionSchema.index({ workspace: 1, budget: 1 });
budgetRevisionSchema.index({ workspace: 1, approvalStatus: 1 });

module.exports = mongoose.models.BudgetRevision || mongoose.model('BudgetRevision', budgetRevisionSchema);
