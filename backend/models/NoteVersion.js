const mongoose = require('mongoose');

const { Schema } = mongoose;

const noteVersionSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    note: { type: Schema.Types.ObjectId, ref: 'Note', required: true },
    versionNumber: { type: Number, required: true },
    title: String,
    content: String,
    contentJson: Schema.Types.Mixed,
    plainText: String,
    changeSummary: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

noteVersionSchema.index({ workspace: 1, note: 1, versionNumber: 1 }, { unique: true });
noteVersionSchema.index({ note: 1, createdAt: -1 });

module.exports = mongoose.models.NoteVersion || mongoose.model('NoteVersion', noteVersionSchema);
