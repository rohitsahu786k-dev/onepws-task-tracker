const mongoose = require('mongoose');

const { Schema } = mongoose;

const noteActivitySchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace' },
    note: { type: Schema.Types.ObjectId, ref: 'Note' },
    action: {
      type: String,
      enum: [
        'created',
        'updated',
        'autosaved',
        'shared',
        'unshared',
        'mentioned_user',
        'attachment_added',
        'attachment_removed',
        'pinned',
        'unpinned',
        'archived',
        'restored',
        'deleted',
        'version_created',
        'version_restored',
        'moved_folder',
        'linked_item_added',
        'linked_item_removed',
      ],
    },
    message: String,
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

noteActivitySchema.index({ workspace: 1, note: 1, createdAt: -1 });
noteActivitySchema.index({ note: 1, createdAt: -1 });

module.exports = mongoose.models.NoteActivity || mongoose.model('NoteActivity', noteActivitySchema);
