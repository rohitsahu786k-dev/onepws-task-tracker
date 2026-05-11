const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String, date: Date,
  type: { type: String, enum: ["public", "company", "optional"], default: "company" },
  isRecurringYearly: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.Holiday || mongoose.model('Holiday', schema);
