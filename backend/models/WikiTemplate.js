const mongoose = require('mongoose');

const { Schema } = mongoose;

const wikiTemplateSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace' },
    name: { type: String, required: true },
    articleType: String,
    description: String,
    defaultTitle: String,
    defaultContent: String,
    defaultContentJson: Schema.Types.Mixed,
    defaultSections: [{ title: String, placeholder: String, required: Boolean, order: Number }],
    tags: [String],
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

wikiTemplateSchema.index({ workspace: 1, isActive: 1 });
wikiTemplateSchema.index({ workspace: 1, articleType: 1 });

module.exports = mongoose.models.WikiTemplate || mongoose.model('WikiTemplate', wikiTemplateSchema);
