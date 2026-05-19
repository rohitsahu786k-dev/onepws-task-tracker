const mongoose = require('mongoose');

const { Schema } = mongoose;

const noteFolderSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true, trim: true },
    description: String,
    parentFolder: { type: Schema.Types.ObjectId, ref: 'NoteFolder' },
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    visibility: { type: String, enum: ['private', 'shared', 'department', 'workspace'], default: 'private' },
    color: String,
    icon: String,
    order: { type: Number, default: 0 },
    isSystemFolder: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

noteFolderSchema.index({ workspace: 1, owner: 1 });
noteFolderSchema.index({ workspace: 1, parentFolder: 1 });
noteFolderSchema.index({ workspace: 1, visibility: 1 });
noteFolderSchema.index({ workspace: 1, order: 1 });

module.exports = mongoose.models.NoteFolder || mongoose.model('NoteFolder', noteFolderSchema);
