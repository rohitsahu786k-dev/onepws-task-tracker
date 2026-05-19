const mongoose = require('mongoose');

const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    paymentNumber: { type: String, required: true },
    expense: { type: Schema.Types.ObjectId, ref: 'Expense', required: true },
    budget: { type: Schema.Types.ObjectId, ref: 'Budget' },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    amount: { type: Number, required: true, min: 0 },
    paymentDate: Date,
    paymentMethod: { type: String, enum: ['cash', 'bank_transfer', 'upi', 'cheque', 'credit_card', 'debit_card', 'online', 'other'] },
    paymentReference: String,
    status: { type: String, enum: ['pending', 'paid', 'failed', 'cancelled'], default: 'pending' },
    proofFile: { mediaFile: { type: Schema.Types.ObjectId, ref: 'MediaFile' }, fileName: String },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: String,
  },
  { timestamps: true }
);

paymentSchema.index({ workspace: 1, paymentNumber: 1 }, { unique: true });
paymentSchema.index({ workspace: 1, expense: 1 });
paymentSchema.index({ workspace: 1, paymentDate: -1 });
paymentSchema.index({ workspace: 1, status: 1 });

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
