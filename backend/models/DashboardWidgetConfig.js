const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  widgets: [{ widgetKey: String, title: String, isVisible: Boolean, order: Number, size: { w: Number, h: Number }, position: { x: Number, y: Number }, settings: { type: Map, of: mongoose.Schema.Types.Mixed } }]
}, { timestamps: true });

module.exports = mongoose.models.DashboardWidgetConfig || mongoose.model('DashboardWidgetConfig', schema);
