const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  key: { type: String, required: true },
  sequence: { type: Number, default: 0 },
}, { timestamps: true });

schema.index({ workspace: 1, key: 1 }, { unique: true });

module.exports = mongoose.models.Counter || mongoose.model('Counter', schema);
