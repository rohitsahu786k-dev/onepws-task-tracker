const mongoose = require('mongoose');

const customRoleSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  name: { type: String, required: true },
  key: { type: String, required: true },
  description: String,
  baseRole: { type: String, enum: ["admin", "manager", "member", "viewer"], required: true },
  permissions: [{ module: String, actions: [String] }],
  isSystem: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

customRoleSchema.index({ workspace: 1, key: 1 }, { unique: true });

module.exports = mongoose.models.CustomRole || mongoose.model('CustomRole', customRoleSchema);
