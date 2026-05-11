const mongoose = require('mongoose');
const { NOTIFICATION_EVENTS } = require('./Notification');

const EMAIL_EVENTS = [
  'email_verification',
  'forgot_password',
  'workspace_invitation',
  ...NOTIFICATION_EVENTS
];

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
    event: { type: String, enum: EMAIL_EVENTS, required: true },
    subject: String,
    htmlBody: String,
    textBody: String,
    variables: [variableSchema],
    isSystem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

schema.index({ workspace: 1, event: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

module.exports = mongoose.models.EmailTemplate || mongoose.model('EmailTemplate', schema);
