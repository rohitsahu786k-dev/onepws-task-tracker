const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  defaultDashboardType: { type: String, default: 'member' },
  refreshMode: { type: String, enum: ['auto', 'manual'], default: 'auto' },
  refreshIntervalSeconds: { type: Number, default: 60 },
  compactMode: { type: Boolean, default: false },
  showWelcomeCard: { type: Boolean, default: true },
  showQuickActions: { type: Boolean, default: true }
}, { timestamps: true });

schema.index({ workspace: 1, user: 1 }, { unique: true });

module.exports = mongoose.models.DashboardPreference || mongoose.model('DashboardPreference', schema);
