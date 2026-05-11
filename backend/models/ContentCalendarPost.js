const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign" },
  title: String, caption: String,
  platform: { type: String, enum: ["facebook", "instagram", "linkedin", "twitter", "youtube", "other"] },
  scheduledDate: Date, publishedDate: Date,
  creativeFile: { type: mongoose.Schema.Types.ObjectId, ref: "MediaFile" },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["idea", "draft", "designed", "review", "approved", "published", "cancelled"], default: "idea" },
  hashtags: [String], remarks: String, task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.ContentCalendarPost || mongoose.model('ContentCalendarPost', schema);
