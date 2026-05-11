const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  deliverableType: { type: String, required: true },
  title: String, description: String,
  questions: [{
    questionId: String, label: String, fieldKey: String,
    questionType: { type: String, enum: ["text", "textarea", "number", "date", "dropdown", "multi_select", "file", "checkbox", "radio"] },
    priority: { type: String, enum: ["critical", "important", "useful"], default: "important" },
    isRequired: Boolean,
    options: [{ label: String, value: String }],
    order: Number, helpText: String
  }],
  isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.IntakeFormConfig || mongoose.model('IntakeFormConfig', schema);
