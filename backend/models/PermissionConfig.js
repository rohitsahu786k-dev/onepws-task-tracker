const mongoose = require('mongoose');

const permissionConfigSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  role: { type: String, enum: ["admin", "manager", "member", "viewer"], required: true },
  permissions: [{
    module: String,
    actions: [String]
  }],
  isSystemDefault: { type: Boolean, default: false },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

permissionConfigSchema.index({ workspace: 1, role: 1 }, { unique: true });

module.exports = mongoose.models.PermissionConfig || mongoose.model('PermissionConfig', permissionConfigSchema);
