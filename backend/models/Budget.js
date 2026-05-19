const mongoose = require('mongoose');

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const approvalSchema = new Schema(
  {
    required: { type: Boolean, default: true },
    status: { type: String, enum: ['not_required', 'pending', 'approved', 'rejected'], default: 'pending' },
    approvers: [
      {
        user: { type: ObjectId, ref: 'User' },
        level: Number,
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        comment: String,
        respondedAt: Date,
      },
    ],
    submittedAt: Date,
    approvedAt: Date,
    approvedBy: { type: ObjectId, ref: 'User' },
    rejectedAt: Date,
    rejectedBy: { type: ObjectId, ref: 'User' },
    rejectionReason: String,
  },
  { _id: false }
);

const budgetSchema = new Schema(
  {
    workspace: { type: ObjectId, ref: 'Workspace', required: true },
    budgetNumber: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: String,
    budgetType: {
      type: String,
      enum: ['workspace', 'department', 'project', 'campaign', 'event', 'vendor', 'monthly', 'quarterly', 'annual', 'ad_hoc'],
      default: 'project',
    },
    project: { type: ObjectId, ref: 'Project' },
    department: { type: ObjectId, ref: 'Department' },
    campaign: { type: ObjectId, ref: 'Campaign' },
    task: { type: ObjectId, ref: 'Task' },
    fiscalYear: String,
    month: Number,
    quarter: Number,
    currency: { type: String, default: 'INR' },
    totalAmount: { type: Number, required: true, min: 0 },
    allocatedAmount: { type: Number, default: 0 },
    spentAmount: { type: Number, default: 0 },
    committedAmount: { type: Number, default: 0 },
    pendingExpenseAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    utilizationPercent: { type: Number, default: 0 },
    categories: [
      {
        categoryName: String,
        categoryKey: String,
        allocatedAmount: { type: Number, default: 0 },
        spentAmount: { type: Number, default: 0 },
        remainingAmount: { type: Number, default: 0 },
        utilizationPercent: { type: Number, default: 0 },
      },
    ],
    approval: { type: approvalSchema, default: () => ({ required: true, status: 'pending' }) },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'pending_approval', 'approved', 'active', 'exhausted', 'over_budget', 'on_hold', 'closed', 'rejected', 'cancelled', 'archived'],
      default: 'draft',
    },
    startDate: Date,
    endDate: Date,
    approvalDeadline: Date,
    reviewDate: Date,
    closingDate: Date,
    alertThresholds: {
      threshold50: { type: Boolean, default: false },
      threshold75: { type: Boolean, default: true },
      threshold90: { type: Boolean, default: true },
      threshold100: { type: Boolean, default: true },
    },
    alertsSent: {
      threshold50: Date,
      threshold75: Date,
      threshold90: Date,
      threshold100: Date,
      overBudget: Date,
    },
    notes: String,
    attachments: [{ mediaFile: { type: ObjectId, ref: 'MediaFile' }, fileName: String, uploadedBy: { type: ObjectId, ref: 'User' }, uploadedAt: Date }],
    isLocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: ObjectId, ref: 'User' },
    approvedBy: { type: ObjectId, ref: 'User' },
    approvedAt: Date,
    createdBy: { type: ObjectId, ref: 'User' },
    updatedBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

budgetSchema.pre('validate', function normalizeBudget(next) {
  if (this.status === 'submitted') this.status = 'pending_approval';
  if (!this.remainingAmount && this.totalAmount !== undefined) this.remainingAmount = this.totalAmount - (this.spentAmount || 0);
  if (!this.allocatedAmount) {
    const categoryTotal = (this.categories || []).reduce((sum, category) => sum + Number(category.allocatedAmount || 0), 0);
    this.allocatedAmount = categoryTotal || this.totalAmount || 0;
  }
  for (const category of this.categories || []) {
    if (category.remainingAmount === undefined || category.remainingAmount === null) {
      category.remainingAmount = Number(category.allocatedAmount || 0) - Number(category.spentAmount || 0);
    }
    category.utilizationPercent = category.allocatedAmount > 0 ? Number(((category.spentAmount / category.allocatedAmount) * 100).toFixed(2)) : 0;
  }
  this.utilizationPercent = this.totalAmount > 0 ? Number((((this.spentAmount || 0) / this.totalAmount) * 100).toFixed(2)) : 0;
  next();
});

budgetSchema.index({ workspace: 1, budgetNumber: 1 }, { unique: true });
budgetSchema.index({ workspace: 1, status: 1 });
budgetSchema.index({ workspace: 1, budgetType: 1 });
budgetSchema.index({ workspace: 1, project: 1 });
budgetSchema.index({ workspace: 1, department: 1 });
budgetSchema.index({ workspace: 1, fiscalYear: 1 });
budgetSchema.index({ workspace: 1, createdAt: -1 });
budgetSchema.index({ workspace: 1, utilizationPercent: 1 });

module.exports = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);
