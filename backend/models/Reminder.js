const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'CalendarEvent', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  minutesBefore: { type: Number, required: true },
  channel: { type: String, enum: ['in_app', 'email', 'both'], default: 'in_app' },
  sent: { type: Boolean, default: false },
  sentAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

schema.index({ workspace: 1, event: 1, user: 1 });
schema.index({ sent: 1, createdAt: 1 });

module.exports = mongoose.models.Reminder || mongoose.model('Reminder', schema);
