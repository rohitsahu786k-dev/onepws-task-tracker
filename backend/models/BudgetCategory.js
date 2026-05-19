const mongoose = require('mongoose');

const { Schema } = mongoose;

const budgetCategorySchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    budget: { type: Schema.Types.ObjectId, ref: 'Budget' },
    name: { type: String, required: true },
    categoryKey: String,
    allocatedAmount: { type: Number, default: 0 },
    spentAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    utilizationPercent: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

budgetCategorySchema.pre('validate', function normalizeCategory(next) {
  if (!this.categoryKey && this.name) {
    this.categoryKey = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }
  this.remainingAmount = Number(this.allocatedAmount || 0) - Number(this.spentAmount || 0);
  this.utilizationPercent = this.allocatedAmount > 0 ? Number(((this.spentAmount / this.allocatedAmount) * 100).toFixed(2)) : 0;
  next();
});

budgetCategorySchema.index({ workspace: 1, isActive: 1 });
budgetCategorySchema.index({ workspace: 1, categoryKey: 1 });

module.exports = mongoose.models.BudgetCategory || mongoose.model('BudgetCategory', budgetCategorySchema);
