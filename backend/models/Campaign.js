const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  campaignNumber: String, name: String, description: String,
  campaignType: { type: String, enum: ["social_media", "email", "event", "product_launch", "brand", "other"] },
  startDate: Date, endDate: Date, budget: { type: mongoose.Schema.Types.ObjectId, ref: "Budget" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, enum: ["planning", "active", "completed", "cancelled"], default: "planning" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.Campaign || mongoose.model('Campaign', schema);
