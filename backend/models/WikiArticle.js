const mongoose = require('mongoose');

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const wikiArticleSchema = new Schema(
  {
    workspace: { type: ObjectId, ref: 'Workspace', required: true },
    articleNumber: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    summary: String,
    articleType: {
      type: String,
      enum: ['sop', 'policy', 'guide', 'faq', 'checklist', 'template', 'brand_guideline', 'process', 'training', 'troubleshooting', 'reference', 'general'],
      default: 'general',
    },
    category: { type: ObjectId, ref: 'WikiCategory' },
    parentArticle: { type: ObjectId, ref: 'WikiArticle' },
    content: { type: String, default: '' },
    contentJson: Schema.Types.Mixed,
    plainText: { type: String, default: '' },
    tableOfContents: [{ id: String, title: String, level: Number, order: Number }],
    tags: [String],
    linkedItems: [
      {
        refModel: { type: String, enum: ['Task', 'Project', 'Meeting', 'MOM', 'SLAConfig', 'SLATracker', 'Budget', 'Expense', 'MediaFile', 'Note'] },
        refId: ObjectId,
        label: String,
      },
    ],
    relatedArticles: [{ type: ObjectId, ref: 'WikiArticle' }],
    attachments: [
      {
        mediaFile: { type: ObjectId, ref: 'MediaFile' },
        fileName: String,
        uploadedBy: { type: ObjectId, ref: 'User' },
        uploadedAt: Date,
      },
    ],
    visibility: { type: String, enum: ['private', 'department', 'workspace', 'public_internal'], default: 'workspace' },
    allowedDepartments: [{ type: ObjectId, ref: 'Department' }],
    allowedUsers: [
      {
        user: { type: ObjectId, ref: 'User' },
        permission: { type: String, enum: ['view', 'edit', 'approve'], default: 'view' },
      },
    ],
    owner: { type: ObjectId, ref: 'User' },
    reviewers: [{ type: ObjectId, ref: 'User' }],
    approval: {
      required: { type: Boolean, default: true },
      status: { type: String, enum: ['not_required', 'pending', 'approved', 'rejected'], default: 'pending' },
      approvers: [
        {
          user: { type: ObjectId, ref: 'User' },
          status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
          comment: String,
          respondedAt: Date,
        },
      ],
      submittedAt: Date,
      approvedAt: Date,
      approvedBy: { type: ObjectId, ref: 'User' },
      rejectedAt: Date,
      rejectedBy: { type: ObjectId, ref: 'User' },
      rejectionReason: String,
    },
    status: { type: String, enum: ['draft', 'pending_review', 'published', 'rejected', 'needs_update', 'archived', 'deprecated'], default: 'draft' },
    version: { type: Number, default: 1 },
    publishedAt: Date,
    publishedBy: { type: ObjectId, ref: 'User' },
    lastReviewedAt: Date,
    lastReviewedBy: { type: ObjectId, ref: 'User' },
    nextReviewDate: Date,
    reviewFrequencyDays: { type: Number, default: 90 },
    readCount: { type: Number, default: 0 },
    helpfulCount: { type: Number, default: 0 },
    notHelpfulCount: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    lockedAt: Date,
    lockedBy: { type: ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: ObjectId, ref: 'User' },
    createdBy: { type: ObjectId, ref: 'User' },
    updatedBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

wikiArticleSchema.index({ workspace: 1, articleNumber: 1 }, { unique: true });
wikiArticleSchema.index({ workspace: 1, slug: 1 }, { unique: true });
wikiArticleSchema.index({ workspace: 1, status: 1 });
wikiArticleSchema.index({ workspace: 1, articleType: 1 });
wikiArticleSchema.index({ workspace: 1, category: 1 });
wikiArticleSchema.index({ workspace: 1, owner: 1 });
wikiArticleSchema.index({ workspace: 1, createdBy: 1 });
wikiArticleSchema.index({ workspace: 1, updatedAt: -1 });
wikiArticleSchema.index({ workspace: 1, nextReviewDate: 1 });
wikiArticleSchema.index({ workspace: 1, isPinned: 1 });
wikiArticleSchema.index({ workspace: 1, isFeatured: 1 });
wikiArticleSchema.index({ title: 'text', summary: 'text', plainText: 'text', tags: 'text' });

module.exports = mongoose.models.WikiArticle || mongoose.model('WikiArticle', wikiArticleSchema);
