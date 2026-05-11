const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  weekStartDate: Date, weekEndDate: Date, totalHours: Number,
  entries: [{ type: mongoose.Schema.Types.ObjectId, ref: "Timesheet" }],
  status: { type: String, enum: ["submitted", "approved", "rejected"], default: "submitted" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, approvedAt: Date, comments: String
}, { timestamps: true });

module.exports = mongoose.models.TimesheetApproval || mongoose.model('TimesheetApproval', schema);
