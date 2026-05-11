const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const REPORT_TYPES = [
  'dashboard_summary',
  'daily_tracker',
  'task',
  'user_performance',
  'department',
  'project',
  'sla',
  'delay',
  'pending_task',
  'submitted_task',
  'mom',
  'meeting',
  'calendar',
  'budget',
  'expense',
  'timesheet',
  'media',
  'intake',
  'approval',
  'monthly_management',
  'custom'
];

const reportSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  reportNumber: { type: String, unique: true, sparse: true },
  title: { type: String, required: true },
  reportType: { type: String, enum: REPORT_TYPES, required: true },
  filters: {
    dateFrom: Date,
    dateTo: Date,
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    departments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    taskTypes: [String],
    statuses: [String],
    priorities: [String],
    slaStatuses: [String],
    delayStatuses: [String],
    productTypes: [String],
    includeArchived: { type: Boolean, default: false }
  },
  summary: {
    totalTasks: Number,
    completedTasks: Number,
    pendingTasks: Number,
    delayedTasks: Number,
    onTimeTasks: Number,
    averageDelayDays: Number,
    completionRate: Number,
    slaComplianceRate: Number,
    totalBudget: Number,
    totalExpense: Number
  },
  generatedFiles: {
    pdfPath: String,
    pdfUrl: String,
    excelPath: String,
    excelUrl: String,
    csvPath: String,
    csvUrl: String
  },
  status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
  errorMessage: String,
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

reportSchema.index({ workspace: 1, reportType: 1 });
reportSchema.index({ workspace: 1, createdAt: -1 });
reportSchema.index({ generatedBy: 1 });
reportSchema.plugin(mongoosePaginate);

reportSchema.statics.REPORT_TYPES = REPORT_TYPES;

module.exports = mongoose.models.Report || mongoose.model('Report', reportSchema);
