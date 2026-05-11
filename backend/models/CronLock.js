const mongoose = require('mongoose');

const cronLockSchema = new mongoose.Schema({
  jobName: { type: String, unique: true, required: true },
  lockedUntil: Date,
  lockedBy: String,
  lastRunAt: Date,
  lastCompletedAt: Date,
  status: {
    type: String,
    enum: ["idle", "running", "failed"],
    default: "idle"
  },
  errorMessage: String,
}, { timestamps: true });

cronLockSchema.index({ jobName: 1, lockedUntil: 1 });

module.exports = mongoose.model('CronLock', cronLockSchema);
