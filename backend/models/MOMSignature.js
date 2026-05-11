const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  mom: { type: mongoose.Schema.Types.ObjectId, ref: "MOM" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String, designation: String, department: String,
  signatureText: String, signatureImage: String,
  ipAddress: String, userAgent: String,
  signedAt: Date
}, { timestamps: true });

module.exports = mongoose.models.MOMSignature || mongoose.model('MOMSignature', schema);
