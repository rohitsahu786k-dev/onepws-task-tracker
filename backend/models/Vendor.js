const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  name: String, vendorType: { type: String, enum: ["printing", "design", "event", "digital", "production", "other"] },
  contactPerson: String, phone: String, email: String, address: String, services: [String],
  rateCard: [{ serviceName: String, unit: String, rate: Number, currency: { type: String, default: "INR" } }],
  rating: Number, notes: String, isActive: Boolean, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.models.Vendor || mongoose.model('Vendor', schema);
