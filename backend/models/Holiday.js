const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ["public", "company", "optional", "department"], default: "company" },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  description: String,
  repeatsAnnually: { type: Boolean, default: false },
  isRecurringYearly: Boolean,
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

schema.pre('validate', function normalizeLegacyFields(next) {
  if (this.isRecurringYearly !== undefined && this.repeatsAnnually === undefined) {
    this.repeatsAnnually = this.isRecurringYearly;
  }
  next();
});

schema.index({ workspace: 1, date: 1 });
schema.index({ workspace: 1, type: 1 });
schema.index({ workspace: 1, department: 1 });

module.exports = mongoose.models.Holiday || mongoose.model('Holiday', schema);
