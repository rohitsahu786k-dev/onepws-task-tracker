const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  expenseNumber: { type: String, unique: true },
  budget: { type: mongoose.Schema.Types.ObjectId, ref: "Budget" },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "BudgetCategory" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  title: String, description: String,
  amount: Number, currency: { type: String, default: "INR" },
  paymentDate: Date, paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
  receiptFile: { fileName: String, filePath: String, fileUrl: String },
  status: { type: String, enum: ["pending", "submitted", "approved", "rejected", "paid"], default: "pending" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, approvedAt: Date,
  rejectionReason: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.Expense || mongoose.model('Expense', schema);
