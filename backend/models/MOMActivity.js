const mongoose = require('mongoose');

const { Schema } = mongoose;

const momActivitySchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    mom: { type: Schema.Types.ObjectId, ref: 'MOM', required: true },
    action: {
      type: String,
      enum: [
        'created',
        'updated',
        'sent_for_signature',
        'signed',
        'signature_reminder_sent',
        'point_added',
        'point_updated',
        'point_completed',
        'point_overdue',
        'pdf_generated',
        'email_sent',
        'cancelled',
        'archived',
        'deleted',
        'restored',
      ],
      required: true,
    },
    message: String,
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

momActivitySchema.index({ workspace: 1, mom: 1, createdAt: -1 });
momActivitySchema.index({ mom: 1, createdAt: -1 });

module.exports = mongoose.models.MOMActivity || mongoose.model('MOMActivity', momActivitySchema);
