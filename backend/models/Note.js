const mongoose = require('mongoose');

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const noteSchema = new Schema(
  {
    workspace: { type: ObjectId, ref: 'Workspace', required: true },
    title: { type: String, required: true, trim: true },
    slug: String,
    noteType: {
      type: String,
      enum: ['personal', 'task', 'project', 'meeting', 'mom', 'client', 'vendor', 'campaign', 'internal', 'research', 'general'],
      default: 'general',
    },
    content: { type: String, default: '' },
    contentHtml: { type: String, default: '' },
    contentJson: Schema.Types.Mixed,
    plainText: { type: String, default: '' },

    folder: { type: ObjectId, ref: 'NoteFolder' },
    project: { type: ObjectId, ref: 'Project' },
    task: { type: ObjectId, ref: 'Task' },
    meeting: { type: ObjectId, ref: 'Meeting' },
    mom: { type: ObjectId, ref: 'MOM' },
    intakeForm: { type: ObjectId, ref: 'IntakeForm' },
    campaign: { type: ObjectId, ref: 'Campaign' },
    vendor: { type: ObjectId, ref: 'Vendor' },

    linkedItems: [
      {
        refModel: { type: String, enum: ['Task', 'Project', 'Meeting', 'MOM', 'IntakeForm', 'Campaign', 'Vendor', 'MediaFile'] },
        refId: { type: ObjectId },
      },
    ],
    linkedTasks: [{ type: ObjectId, ref: 'Task' }],
    linkedProjects: [{ type: ObjectId, ref: 'Project' }],

    tags: [String],
    color: String,
    icon: String,
    visibility: { type: String, enum: ['private', 'shared', 'department', 'workspace'], default: 'private' },
    sharedWith: [
      {
        user: { type: ObjectId, ref: 'User' },
        permission: { type: String, enum: ['view', 'comment', 'edit'], default: 'view' },
        sharedAt: Date,
        sharedBy: { type: ObjectId, ref: 'User' },
      },
    ],
    sharedDepartments: [
      {
        department: { type: ObjectId, ref: 'Department' },
        permission: { type: String, enum: ['view', 'comment', 'edit'], default: 'view' },
      },
    ],
    mentions: [{ type: ObjectId, ref: 'User' }],
    attachments: [
      {
        mediaFile: { type: ObjectId, ref: 'MediaFile' },
        fileName: String,
        uploadedBy: { type: ObjectId, ref: 'User' },
        uploadedAt: Date,
      },
    ],

    isPinned: { type: Boolean, default: false },
    pinnedAt: Date,
    isFavorite: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    archivedAt: Date,
    archivedBy: { type: ObjectId, ref: 'User' },
    version: { type: Number, default: 1 },
    lastEditedAt: Date,
    lastEditedBy: { type: ObjectId, ref: 'User' },
    autoSaveAt: Date,
    isLocked: { type: Boolean, default: false },
    lockedAt: Date,
    lockedBy: { type: ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: ObjectId, ref: 'User' },
    createdBy: { type: ObjectId, ref: 'User', required: true },
    updatedBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

noteSchema.index({ workspace: 1, createdBy: 1 });
noteSchema.index({ workspace: 1, visibility: 1 });
noteSchema.index({ workspace: 1, folder: 1 });
noteSchema.index({ workspace: 1, project: 1 });
noteSchema.index({ workspace: 1, task: 1 });
noteSchema.index({ workspace: 1, meeting: 1 });
noteSchema.index({ workspace: 1, mom: 1 });
noteSchema.index({ workspace: 1, isArchived: 1 });
noteSchema.index({ workspace: 1, isPinned: 1 });
noteSchema.index({ workspace: 1, updatedAt: -1 });
noteSchema.index({ title: 'text', plainText: 'text', tags: 'text' });

module.exports = mongoose.models.Note || mongoose.model('Note', noteSchema);
