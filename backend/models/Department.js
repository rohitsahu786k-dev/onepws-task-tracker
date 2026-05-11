const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  name: { type: String, required: true },
  code: { type: String, uppercase: true },
  description: String,
  head: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    designation: String,
    joinedAt: Date
  }],
  permissions: {
    canCreateRequest: Boolean, canViewOwnRequests: Boolean, canViewDepartmentRequests: Boolean,
    canApproveMOM: Boolean, canAccessReports: Boolean, canAccessBudget: Boolean
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.Department || mongoose.model('Department', schema);
