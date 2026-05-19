const mongoose = require('mongoose');

const { Schema } = mongoose;

const wikiActivitySchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace' },
    article: { type: Schema.Types.ObjectId, ref: 'WikiArticle' },
    action: {
      type: String,
      enum: ['created', 'updated', 'submitted_for_review', 'approved', 'rejected', 'published', 'archived', 'deprecated', 'restored', 'deleted', 'version_created', 'version_restored', 'comment_added', 'comment_resolved', 'feedback_given', 'attachment_added', 'attachment_removed', 'related_article_added', 'related_article_removed', 'linked_item_added', 'marked_needs_update', 'review_completed'],
    },
    message: String,
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

wikiActivitySchema.index({ workspace: 1, article: 1, createdAt: -1 });
wikiActivitySchema.index({ article: 1, createdAt: -1 });

module.exports = mongoose.models.WikiActivity || mongoose.model('WikiActivity', wikiActivitySchema);
