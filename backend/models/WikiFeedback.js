const mongoose = require('mongoose');

const { Schema } = mongoose;

const wikiFeedbackSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace' },
    article: { type: Schema.Types.ObjectId, ref: 'WikiArticle' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    helpful: { type: Boolean, required: true },
    comment: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

wikiFeedbackSchema.index({ workspace: 1, article: 1 });
wikiFeedbackSchema.index({ article: 1, user: 1 });

module.exports = mongoose.models.WikiFeedback || mongoose.model('WikiFeedback', wikiFeedbackSchema);
