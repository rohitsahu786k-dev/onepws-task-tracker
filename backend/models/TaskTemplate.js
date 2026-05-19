const mongoose = require('mongoose');

const { Schema } = mongoose;

const taskTemplateSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true, trim: true },
    description: String,
    taskType: String,
    taskCategory: String,
    deliverableType: String,
    defaultPriority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    defaultEstimatedHours: Number,
    defaultChecklist: [{ title: String, order: Number }],
    checklist: [{ title: String, order: Number }],
    defaultAssignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    approvalRequired: { type: Boolean, default: false },
    defaultFields: { type: Map, of: Schema.Types.Mixed },
    slaConfig: { type: Schema.Types.ObjectId, ref: 'SLAConfig' },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

taskTemplateSchema.pre('validate', function normalizeChecklist(next) {
  if ((!this.defaultChecklist || !this.defaultChecklist.length) && this.checklist?.length) {
    this.defaultChecklist = this.checklist;
  }
  if ((!this.checklist || !this.checklist.length) && this.defaultChecklist?.length) {
    this.checklist = this.defaultChecklist;
  }
  if (!this.taskType && this.taskCategory) this.taskType = this.taskCategory;
  next();
});

taskTemplateSchema.index({ workspace: 1, isActive: 1 });
taskTemplateSchema.index({ workspace: 1, name: 1 });

module.exports = mongoose.models.TaskTemplate || mongoose.model('TaskTemplate', taskTemplateSchema);
