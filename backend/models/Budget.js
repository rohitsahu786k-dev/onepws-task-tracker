const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  budgetNumber: { type: String, unique: true },
  title: String, description: String,
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  totalAmount: Number, spentAmount: { type: Number, default: 0 }, remainingAmount: Number,
  currency: { type: String, default: "INR" },
  approvalDeadline: Date,
  reviewDate: Date,
  closingDate: Date,
  fiscalYear: String, month: Number,
  status: { type: String, enum: ["draft", "submitted", "approved", "rejected", "active", "closed"], default: "draft" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, approvedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.Budget || mongoose.model('Budget', schema);
