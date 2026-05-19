const mongoose = require('mongoose');

const { Schema } = mongoose;

const wikiCategorySchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    description: String,
    parentCategory: { type: Schema.Types.ObjectId, ref: 'WikiCategory' },
    icon: String,
    color: String,
    order: { type: Number, default: 0 },
    visibility: { type: String, enum: ['workspace', 'department', 'private'], default: 'workspace' },
    allowedDepartments: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
    articleCount: { type: Number, default: 0 },
    isSystemCategory: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

wikiCategorySchema.index({ workspace: 1, slug: 1 }, { unique: true });
wikiCategorySchema.index({ workspace: 1, parentCategory: 1 });
wikiCategorySchema.index({ workspace: 1, order: 1 });
wikiCategorySchema.index({ workspace: 1, isActive: 1 });

module.exports = mongoose.models.WikiCategory || mongoose.model('WikiCategory', wikiCategorySchema);
