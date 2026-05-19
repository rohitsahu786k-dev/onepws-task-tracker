const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  printJob: { type: mongoose.Schema.Types.ObjectId, ref: 'PrintJob', required: true },
  dispatchNumber: { type: String, required: true },
  quantityDispatched: { type: Number, required: true },
  dispatchDate: { type: Date, required: true },
  courierName: String,
  trackingNumber: String,
  trackingUrl: String,
  vehicleNumber: String,
  driverName: String,
  driverPhone: String,
  dispatchMode: { type: String, enum: ['courier', 'transport', 'self_pickup', 'vendor_delivery', 'company_vehicle', 'other'], default: 'courier' },
  deliveryAddress: Object,
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  receivedBy: String,
  proofOfDelivery: { mediaFile: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaFile' }, fileName: String },
  status: { type: String, enum: ['created', 'dispatched', 'in_transit', 'delivered', 'delivery_failed', 'returned', 'cancelled'], default: 'created' },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

schema.index({ workspace: 1, dispatchNumber: 1 }, { unique: true });
schema.index({ workspace: 1, printJob: 1 });
schema.index({ workspace: 1, status: 1 });

module.exports = mongoose.models.PrintDispatch || mongoose.model('PrintDispatch', schema);
