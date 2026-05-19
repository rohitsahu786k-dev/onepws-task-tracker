const mongoose = require('mongoose');

const { Schema } = mongoose;

const employeeSkillSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true, trim: true },
    category: String,
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

employeeSkillSchema.index({ workspace: 1, name: 1 }, { unique: true });

module.exports = mongoose.models.EmployeeSkill || mongoose.model('EmployeeSkill', employeeSkillSchema);
