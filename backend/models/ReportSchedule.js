const mongoose = require('mongoose');

const reportScheduleSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  name: String,
  reportType: String,
  frequency: {
    type: String,
    enum: ["daily", "weekly", "monthly", "quarterly"],
    required: true
  },
  scheduleTime: String,
  dayOfWeek: Number,
  dayOfMonth: Number,
  filters: { type: Map, of: mongoose.Schema.Types.Mixed },
  recipients: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: String
  }],
  formats: {
    pdf: { type: Boolean, default: true },
    excel: { type: Boolean, default: false },
    csv: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true },
  lastRunAt: Date,
  nextRunAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

reportScheduleSchema.index({ workspace: 1, isActive: 1 });
reportScheduleSchema.index({ nextRunAt: 1 });

module.exports = mongoose.model('ReportSchedule', reportScheduleSchema);
