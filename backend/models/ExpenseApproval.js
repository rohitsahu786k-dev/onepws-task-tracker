const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', index: true },
  expense: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense', required: true, index: true },
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  level: { type: Number, default: 1 },
  comment: String,
  actedAt: Date,
}, { timestamps: true });

module.exports = mongoose.models.ExpenseApproval || mongoose.model('ExpenseApproval', schema);
