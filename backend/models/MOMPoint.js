const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  mom: { type: mongoose.Schema.Types.ObjectId, ref: "MOM" },
  pointNumber: Number, discussionPoint: String, decisionTaken: String,
  responsiblePerson: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  targetClosureDate: Date, actualClosureDate: Date,
  status: { type: String, enum: ["open", "in_progress", "closed", "overdue"], default: "open" },
  remarks: String
}, { timestamps: true });

module.exports = mongoose.models.MOMPoint || mongoose.model('MOMPoint', schema);
