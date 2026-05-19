const mongoose = require('mongoose');

const { Schema } = mongoose;

const designationSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    title: { type: String, required: true, trim: true },
    code: String,
    description: String,
    level: { type: Number, default: 1 },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    roleCategory: {
      type: String,
      enum: ['leadership', 'manager', 'executive', 'designer', 'content', 'developer', 'finance', 'admin', 'support', 'other'],
      default: 'other',
    },
    defaultPermissions: [String],
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

designationSchema.index({ workspace: 1, title: 1 });
designationSchema.index({ workspace: 1, department: 1 });
designationSchema.index({ workspace: 1, isActive: 1 });

module.exports = mongoose.models.Designation || mongoose.model('Designation', designationSchema);
