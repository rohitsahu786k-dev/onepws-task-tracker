const mongoose = require('mongoose');

const { Schema } = mongoose;

const wikiCommentSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    article: { type: Schema.Types.ObjectId, ref: 'WikiArticle', required: true },
    parentComment: { type: Schema.Types.ObjectId, ref: 'WikiComment' },
    message: { type: String, required: true },
    commentType: { type: String, enum: ['comment', 'suggestion', 'correction', 'question'], default: 'comment' },
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    resolved: { type: Boolean, default: false },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

wikiCommentSchema.index({ workspace: 1, article: 1, createdAt: -1 });
wikiCommentSchema.index({ article: 1, createdAt: -1 });
wikiCommentSchema.index({ mentions: 1, createdAt: -1 });

module.exports = mongoose.models.WikiComment || mongoose.model('WikiComment', wikiCommentSchema);
