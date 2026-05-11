const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  startedAt: Date, stoppedAt: Date,
  durationSeconds: Number, note: String,
  status: { type: String, enum: ["running", "stopped"], default: "running" }
}, { timestamps: true });

module.exports = mongoose.models.TaskTimer || mongoose.model('TaskTimer', schema);
