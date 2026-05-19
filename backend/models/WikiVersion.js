const mongoose = require('mongoose');

const { Schema } = mongoose;

const wikiVersionSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    article: { type: Schema.Types.ObjectId, ref: 'WikiArticle', required: true },
    versionNumber: { type: Number, required: true },
    title: String,
    summary: String,
    content: String,
    contentJson: Schema.Types.Mixed,
    plainText: String,
    tags: [String],
    changeSummary: String,
    changeType: { type: String, enum: ['created', 'minor_edit', 'major_update', 'review_update', 'restore'], default: 'minor_edit' },
    statusAtVersion: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

wikiVersionSchema.index({ workspace: 1, article: 1, versionNumber: 1 }, { unique: true });
wikiVersionSchema.index({ article: 1, createdAt: -1 });

module.exports = mongoose.models.WikiVersion || mongoose.model('WikiVersion', wikiVersionSchema);
