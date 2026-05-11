const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  config: { type: mongoose.Schema.Types.ObjectId, ref: "TrackerFieldConfig", required: true },
  rowNumber: Number,
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  rowData: { type: Map, of: mongoose.Schema.Types.Mixed },
  calculatedData: { type: Map, of: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ["draft", "pending", "submitted", "locked", "archived"], default: "draft" },
  isLocked: { type: Boolean, default: false },
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, lockedAt: Date,
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, submittedAt: Date,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.TrackerRow || mongoose.model('TrackerRow', schema);
