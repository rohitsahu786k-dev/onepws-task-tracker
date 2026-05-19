const mongoose = require('mongoose');

const { Schema } = mongoose;

const momTemplateSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true, trim: true },
    momType: {
      type: String,
      enum: ['kickoff', 'project_review', 'design_review', 'client_discussion', 'budget_review', 'sla_review', 'internal', 'vendor', 'general'],
      default: 'general',
    },
    sections: [{ key: String, title: String, enabled: Boolean, order: Number }],
    defaultAgenda: String,
    defaultDiscussionPoints: [{ title: String, description: String }],
    defaultActionPointFields: [{ fieldKey: String, label: String, required: Boolean }],
    branding: {
      showLogo: { type: Boolean, default: true },
      showCompanyName: { type: Boolean, default: true },
      showGeneratedBy: { type: Boolean, default: true },
      showSignatures: { type: Boolean, default: true },
    },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

momTemplateSchema.index({ workspace: 1, momType: 1 });
momTemplateSchema.index({ workspace: 1, isDefault: 1 });
momTemplateSchema.index({ workspace: 1, isActive: 1 });

module.exports = mongoose.models.MOMTemplate || mongoose.model('MOMTemplate', momTemplateSchema);
