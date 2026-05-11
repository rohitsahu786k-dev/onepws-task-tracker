const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
  printJobNumber: String, itemName: String, paperType: String, quantity: Number, size: String, colorType: String,
  samplePrintDate: Date, sampleApprovedDate: Date, finalPrintDate: Date,
  costPerPiece: Number, totalCost: Number,
  status: { type: String, enum: ["planned", "sample_print", "sample_approved", "final_print", "delivered", "cancelled"], default: "planned" },
  remarks: String, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.PrintJob || mongoose.model('PrintJob', schema);
