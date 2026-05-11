const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  title: String, message: String,
  type: { type: String, enum: ["info", "success", "warning", "urgent"], default: "info" },
  visibleFrom: Date, visibleUntil: Date,
  targetAudience: { type: String, enum: ["all", "department", "role", "specific_users"], default: "all" },
  departments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Department" }],
  roles: [String], users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isActive: Boolean, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.Announcement || mongoose.model('Announcement', schema);
