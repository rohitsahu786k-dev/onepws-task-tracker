const mongoose = require('mongoose');

const reportTemplateSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  name: String,
  reportType: String,
  sections: [{
    key: String,
    title: String,
    enabled: { type: Boolean, default: true },
    order: Number
  }],
  branding: {
    showLogo: { type: Boolean, default: true },
    showCompanyName: { type: Boolean, default: true },
    showGeneratedBy: { type: Boolean, default: true },
    showGeneratedAt: { type: Boolean, default: true },
    showFilters: { type: Boolean, default: true }
  },
  charts: [{
    chartKey: String,
    chartType: { type: String, enum: ['bar', 'line', 'pie', 'donut', 'area', 'table'] },
    title: String,
    enabled: { type: Boolean, default: true },
    order: Number
  }],
  columns: [{
    fieldKey: String,
    label: String,
    visible: { type: Boolean, default: true },
    order: Number,
    width: Number
  }],
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

reportTemplateSchema.index({ workspace: 1, reportType: 1, isActive: 1 });
reportTemplateSchema.index({ workspace: 1, isDefault: 1 });

module.exports = mongoose.models.ReportTemplate || mongoose.model('ReportTemplate', reportTemplateSchema);
