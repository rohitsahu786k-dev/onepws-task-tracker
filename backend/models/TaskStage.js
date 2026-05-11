const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  name: { type: String, required: true },
  key: String, color: String, order: Number,
  type: { type: String, enum: ["todo", "in_progress", "review", "blocked", "done", "custom"], default: "custom" },
  isDefault: { type: Boolean, default: false },
  isFinalStage: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.models.TaskStage || mongoose.model('TaskStage', schema);
