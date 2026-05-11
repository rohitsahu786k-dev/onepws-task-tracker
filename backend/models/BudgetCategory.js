const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  budget: { type: mongoose.Schema.Types.ObjectId, ref: "Budget" },
  name: String, allocatedAmount: Number, spentAmount: { type: Number, default: 0 }, remainingAmount: Number
}, { timestamps: true });

module.exports = mongoose.models.BudgetCategory || mongoose.model('BudgetCategory', schema);
