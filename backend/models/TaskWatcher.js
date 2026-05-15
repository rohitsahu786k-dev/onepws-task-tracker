const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  notificationLevel: { type: String, enum: ['all', 'mentions', 'none'], default: 'all' },
}, { timestamps: true });

schema.index({ task: 1, user: 1 }, { unique: true });
module.exports = mongoose.models.TaskWatcher || mongoose.model('TaskWatcher', schema);
