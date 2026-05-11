const mongoose = require('mongoose');

const cronJobLogSchema = new mongoose.Schema({
  jobName: { type: String, required: true },
  status: {
    type: String,
    enum: ["started", "completed", "failed", "skipped"]
  },
  startedAt: Date,
  completedAt: Date,
  durationMs: Number,
  processedCount: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  errorMessage: String,
  errorStack: String,
  metadata: Object,
}, { timestamps: true });

cronJobLogSchema.index({ jobName: 1, createdAt: -1 });
cronJobLogSchema.index({ status: 1 });

module.exports = mongoose.model('CronJobLog', cronJobLogSchema);
