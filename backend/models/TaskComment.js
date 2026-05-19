const mongoose = require('mongoose');

const { Schema } = mongoose;

const taskCommentSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    parentComment: { type: Schema.Types.ObjectId, ref: 'TaskComment' },
    message: { type: String, required: true, trim: true },
    comment: String,
    commentType: {
      type: String,
      enum: ['comment', 'internal_note', 'feedback', 'approval_comment'],
      default: 'comment',
    },
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    attachments: [
      {
        mediaFile: { type: Schema.Types.ObjectId, ref: 'MediaFile' },
        fileName: String,
        filePath: String,
        fileUrl: String,
        mimeType: String,
        size: Number,
      },
    ],
    isInternal: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    editedAt: Date,
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

taskCommentSchema.pre('validate', function normalizeMessage(next) {
  if (!this.message && this.comment) this.message = this.comment;
  if (!this.comment && this.message) this.comment = this.message;
  next();
});

taskCommentSchema.index({ workspace: 1, task: 1, createdAt: -1 });
taskCommentSchema.index({ task: 1, createdAt: -1 });
taskCommentSchema.index({ mentions: 1, createdAt: -1 });

module.exports = mongoose.models.TaskComment || mongoose.model('TaskComment', taskCommentSchema);
