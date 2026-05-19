const mongoose = require('mongoose');

const { Schema } = mongoose;

const employeeActivitySchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace' },
    employee: { type: Schema.Types.ObjectId, ref: 'EmployeeProfile' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    action: {
      type: String,
      enum: ['created', 'updated', 'profile_completed', 'department_changed', 'designation_changed', 'role_changed', 'manager_changed', 'status_changed', 'availability_changed', 'skill_added', 'skill_removed', 'document_uploaded', 'document_verified', 'profile_image_updated', 'deactivated', 'reactivated', 'deleted', 'restored'],
    },
    message: String,
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

employeeActivitySchema.index({ workspace: 1, employee: 1, createdAt: -1 });
employeeActivitySchema.index({ employee: 1, createdAt: -1 });

module.exports = mongoose.models.EmployeeActivity || mongoose.model('EmployeeActivity', employeeActivitySchema);
