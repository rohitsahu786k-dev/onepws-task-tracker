const mongoose = require('mongoose');

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const approvalSchema = new Schema(
  {
    required: { type: Boolean, default: true },
    status: { type: String, enum: ['not_required', 'pending', 'approved', 'rejected'], default: 'pending' },
    approvers: [
      {
        user: { type: ObjectId, ref: 'User' },
        level: Number,
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        comment: String,
        respondedAt: Date,
      },
    ],
    submittedAt: Date,
    approvedAt: Date,
    approvedBy: { type: ObjectId, ref: 'User' },
    rejectedAt: Date,
    rejectedBy: { type: ObjectId, ref: 'User' },
    rejectionReason: String,
  },
  { _id: false }
);

const expenseSchema = new Schema(
  {
    workspace: { type: ObjectId, ref: 'Workspace', required: true },
    expenseNumber: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: String,
    budget: { type: ObjectId, ref: 'Budget' },
    category: { type: ObjectId, ref: 'BudgetCategory' },
    project: { type: ObjectId, ref: 'Project' },
    task: { type: ObjectId, ref: 'Task' },
    department: { type: ObjectId, ref: 'Department' },
    vendor: { type: ObjectId, ref: 'Vendor' },
    vendorName: String,
    expenseCategory: {
      type: String,
      enum: [
        'printing',
        'design_vendor',
        'event_vendor',
        'photography',
        'video_production',
        'digital_ads',
        'social_media_boost',
        'website_work',
        'catalogue_printing',
        'brochure_printing',
        'flyer_printing',
        'travel',
        'logistics',
        'merchandise',
        'software_subscription',
        'freelancer_payment',
        'miscellaneous',
      ],
      default: 'miscellaneous',
    },
    amount: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    expenseDate: { type: Date, required: true },
    paymentDueDate: Date,
    paymentDate: Date,
    paymentMethod: { type: String, enum: ['cash', 'bank_transfer', 'upi', 'cheque', 'credit_card', 'debit_card', 'online', 'other'] },
    paymentReference: String,
    invoiceNumber: String,
    invoiceDate: Date,
    receiptFiles: [{ mediaFile: { type: ObjectId, ref: 'MediaFile' }, fileName: String, uploadedAt: Date }],
    receiptFile: { fileName: String, filePath: String, fileUrl: String },
    approval: { type: approvalSchema, default: () => ({ required: true, status: 'pending' }) },
    paymentStatus: { type: String, enum: ['unpaid', 'partially_paid', 'paid', 'cancelled'], default: 'unpaid' },
    status: { type: String, enum: ['draft', 'pending', 'submitted', 'pending_approval', 'approved', 'rejected', 'paid', 'cancelled', 'archived'], default: 'draft' },
    reimbursable: { type: Boolean, default: false },
    paidBy: { type: ObjectId, ref: 'User' },
    requestedBy: { type: ObjectId, ref: 'User' },
    notes: String,
    tags: [String],
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: ObjectId, ref: 'User' },
    approvedBy: { type: ObjectId, ref: 'User' },
    approvedAt: Date,
    rejectionReason: String,
    createdBy: { type: ObjectId, ref: 'User' },
    updatedBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

expenseSchema.pre('validate', function normalizeExpense(next) {
  if (this.status === 'pending') this.status = 'draft';
  if (!this.totalAmount && this.amount !== undefined) this.totalAmount = Number(this.amount || 0) + Number(this.taxAmount || 0);
  if (!this.expenseDate) this.expenseDate = new Date();
  next();
});

expenseSchema.index({ workspace: 1, expenseNumber: 1 }, { unique: true });
expenseSchema.index({ workspace: 1, budget: 1 });
expenseSchema.index({ workspace: 1, project: 1 });
expenseSchema.index({ workspace: 1, department: 1 });
expenseSchema.index({ workspace: 1, status: 1 });
expenseSchema.index({ workspace: 1, paymentStatus: 1 });
expenseSchema.index({ workspace: 1, expenseCategory: 1 });
expenseSchema.index({ workspace: 1, expenseDate: -1 });
expenseSchema.index({ workspace: 1, createdBy: 1 });
expenseSchema.index({ workspace: 1, vendor: 1 });

module.exports = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
