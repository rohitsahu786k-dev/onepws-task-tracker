const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  quotationNumber: { type: String, required: true },
  printJob: { type: mongoose.Schema.Types.ObjectId, ref: 'PrintJob', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  vendorName: String,
  quotationDate: { type: Date, required: true },
  validUntil: Date,
  quantity: Number,
  ratePerUnit: { type: Number, default: 0 },
  setupCost: { type: Number, default: 0 },
  designCost: { type: Number, default: 0 },
  printingCost: { type: Number, default: 0 },
  finishingCost: { type: Number, default: 0 },
  packagingCost: { type: Number, default: 0 },
  deliveryCost: { type: Number, default: 0 },
  taxPercent: { type: Number, default: 18 },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  estimatedProductionDays: Number,
  estimatedDeliveryDate: Date,
  paymentTerms: String,
  terms: String,
  quotationFile: { mediaFile: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaFile' }, fileName: String },
  status: { type: String, enum: ['requested', 'received', 'under_review', 'selected', 'rejected', 'expired', 'cancelled'], default: 'received' },
  selectedAt: Date,
  selectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: String,
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

schema.index({ workspace: 1, quotationNumber: 1 }, { unique: true });
schema.index({ workspace: 1, printJob: 1 });
schema.index({ workspace: 1, vendor: 1 });
schema.index({ workspace: 1, status: 1 });

module.exports = mongoose.models.PrintJobQuotation || mongoose.model('PrintJobQuotation', schema);
