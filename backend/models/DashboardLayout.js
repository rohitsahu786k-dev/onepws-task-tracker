const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dashboardType: { type: String, enum: ['super_admin', 'admin', 'manager', 'member', 'finance', 'designer', 'publisher', 'print', 'approver', 'custom'], default: 'member' },
  name: { type: String, default: 'My Dashboard' },
  widgets: [{
    widgetKey: { type: String, required: true },
    titleOverride: String,
    position: { x: Number, y: Number, w: Number, h: Number },
    config: { type: Object, default: {} },
    isVisible: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  }],
  filters: {
    dateRange: { type: String, enum: ['today', 'this_week', 'this_month', 'this_quarter', 'this_year', 'custom'], default: 'this_month' },
    customStartDate: Date,
    customEndDate: Date,
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }
  },
  isDefault: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

schema.index({ workspace: 1, user: 1, dashboardType: 1 }, { unique: true });
schema.index({ workspace: 1, user: 1 });

module.exports = mongoose.models.DashboardLayout || mongoose.model('DashboardLayout', schema);
