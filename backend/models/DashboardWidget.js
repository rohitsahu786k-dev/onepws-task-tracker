const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema({
  w: { type: Number, default: 1 },
  h: { type: Number, default: 1 }
}, { _id: false });

const schema = new mongoose.Schema({
  widgetKey: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  category: { type: String, enum: ['overview', 'action', 'alert', 'chart', 'list', 'calendar', 'performance', 'finance', 'people', 'activity', 'shortcut'], default: 'overview' },
  widgetType: { type: String, enum: ['metric_card', 'multi_metric', 'list', 'chart', 'calendar', 'alert', 'action', 'table', 'progress', 'timeline'], required: true },
  moduleKey: String,
  requiredPermission: String,
  allowedRoles: [String],
  defaultSize: { type: sizeSchema, default: () => ({ w: 1, h: 1 }) },
  minSize: { type: sizeSchema, default: () => ({ w: 1, h: 1 }) },
  maxSize: sizeSchema,
  defaultConfig: { type: Object, default: {} },
  refreshIntervalSeconds: { type: Number, default: 60 },
  isSystemWidget: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

schema.index({ widgetKey: 1 }, { unique: true });
schema.index({ moduleKey: 1 });
schema.index({ category: 1 });
schema.index({ isActive: 1, order: 1 });

module.exports = mongoose.models.DashboardWidget || mongoose.model('DashboardWidget', schema);
