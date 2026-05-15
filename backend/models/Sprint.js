const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
  name: { type: String, required: true, trim: true },
  goal: String,
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ['planned', 'active', 'completed', 'cancelled'], default: 'planned', index: true },
  taskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.models.Sprint || mongoose.model('Sprint', schema);
