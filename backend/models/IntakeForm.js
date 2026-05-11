const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  formConfig: { type: mongoose.Schema.Types.ObjectId, ref: "IntakeFormConfig" },
  requestNumber: { type: String, unique: true },
  deliverableType: String,
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  requestingDepartment: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  answers: { type: Map, of: mongoose.Schema.Types.Mixed },
  attachments: [{ fileName: String, filePath: String, fileUrl: String, mimeType: String, size: Number }],
  status: { type: String, enum: ["draft", "submitted", "under_review", "approved", "rejected", "t0_confirmed", "task_created", "closed"], default: "draft" },
  review: { reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, reviewedAt: Date, remarks: String, rejectionReason: String },
  marketingConfirmationEmailSent: Boolean, t0Date: Date,
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" }
}, { timestamps: true });

module.exports = mongoose.models.IntakeForm || mongoose.model('IntakeForm', schema);
