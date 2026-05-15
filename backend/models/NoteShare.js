const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true, index: true },
  sharedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  permission: { type: String, enum: ['view', 'comment', 'edit'], default: 'view' },
  sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: Date,
}, { timestamps: true });

schema.index({ note: 1, sharedWith: 1 }, { unique: true });
module.exports = mongoose.models.NoteShare || mongoose.model('NoteShare', schema);
