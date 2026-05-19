const mongoose = require('mongoose');

const { Schema } = mongoose;

const momPointSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    mom: { type: Schema.Types.ObjectId, ref: 'MOM', required: true },
    pointNumber: Number,
    title: { type: String, required: true, trim: true },
    description: String,
    discussionPoint: String,
    decisionTaken: String,
    responsiblePerson: { type: Schema.Types.ObjectId, ref: 'User' },
    responsibleDepartment: { type: Schema.Types.ObjectId, ref: 'Department' },
    targetDate: Date,
    targetClosureDate: Date,
    actualClosureDate: Date,
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['open', 'in_progress', 'completed', 'overdue', 'cancelled', 'closed'], default: 'open' },
    linkedTask: { type: Schema.Types.ObjectId, ref: 'Task' },
    calendarEvent: { type: Schema.Types.ObjectId, ref: 'CalendarEvent' },
    completedAt: Date,
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: String,
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

momPointSchema.pre('validate', function normalizePoint(next) {
  if (!this.title && this.discussionPoint) this.title = this.discussionPoint;
  if (!this.description && this.decisionTaken) this.description = this.decisionTaken;
  if (!this.targetDate && this.targetClosureDate) this.targetDate = this.targetClosureDate;
  if (!this.targetClosureDate && this.targetDate) this.targetClosureDate = this.targetDate;
  if (this.status === 'closed') this.status = 'completed';
  next();
});

momPointSchema.index({ workspace: 1, mom: 1 });
momPointSchema.index({ workspace: 1, responsiblePerson: 1 });
momPointSchema.index({ workspace: 1, targetDate: 1 });
momPointSchema.index({ workspace: 1, status: 1 });

module.exports = mongoose.models.MOMPoint || mongoose.model('MOMPoint', momPointSchema);
