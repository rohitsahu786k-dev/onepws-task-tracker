const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  feature: { type: String, enum: ["task_description", "mom_summary", "report_insight", "smart_reply", "duplicate_task_detection"] },
  prompt: String, response: String, model: String, tokensUsed: Number,
  refModel: String, refId: mongoose.Schema.Types.ObjectId,
  status: { type: String, enum: ["success", "failed"], default: "success" },
  errorMessage: String
}, { timestamps: false });

module.exports = mongoose.models.AIRequestLog || mongoose.model('AIRequestLog', schema);
