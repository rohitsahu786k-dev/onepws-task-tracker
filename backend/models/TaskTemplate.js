const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String, description: String,
  taskCategory: String, deliverableType: String,
  defaultPriority: String,
  defaultAssignees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  checklist: [{ title: String, order: Number }],
  defaultFields: { type: Map, of: mongoose.Schema.Types.Mixed },
  slaConfig: { type: mongoose.Schema.Types.ObjectId, ref: "SLAConfig" },
  isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.TaskTemplate || mongoose.model('TaskTemplate', schema);
