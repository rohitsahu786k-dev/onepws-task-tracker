const mongoose = require('mongoose');
const { NOTIFICATION_EVENTS } = require('./Notification');

const variableSchema = new mongoose.Schema(
  {
    key: String,
    description: String,
    example: String
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
    name: { type: String, trim: true },
    event: { type: String, enum: NOTIFICATION_EVENTS, required: true },
    channel: { type: String, enum: ['in_app', 'slack', 'telegram'], required: true },
    titleTemplate: String,
    bodyTemplate: String,
    actionText: String,
    isSystem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    variables: [variableSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

schema.index({ workspace: 1, event: 1, channel: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

module.exports = mongoose.models.NotificationTemplate || mongoose.model('NotificationTemplate', schema);
