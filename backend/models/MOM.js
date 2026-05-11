const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  momNumber: { type: String, unique: true },
  docNumber: { type: String, default: "IMS-01-04-L4-04" },
  title: String,
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  meeting: { type: mongoose.Schema.Types.ObjectId, ref: "Meeting" },
  meetingDate: Date, location: String, agenda: String,
  attendees: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String, department: String, designation: String, email: String,
    signatureRequired: Boolean, signed: Boolean, signedAt: Date
  }],
  status: { type: String, enum: ["draft", "sent_for_signature", "partially_signed", "signed", "closed"], default: "draft" },
  pdfFilePath: String, pdfFileUrl: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.MOM || mongoose.model('MOM', schema);
