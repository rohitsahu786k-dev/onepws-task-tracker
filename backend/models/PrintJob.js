const mongoose = require('mongoose');

const fileRefSchema = new mongoose.Schema({
  mediaFile: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaFile' },
  fileName: String
}, { _id: false });

const addressSchema = new mongoose.Schema({
  name: String,
  phone: String,
  line1: String,
  line2: String,
  city: String,
  state: String,
  country: { type: String, default: 'India' },
  pincode: String
}, { _id: false });

const schema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  printJobNumber: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: String,
  printJobType: { type: String, enum: ['catalogue', 'brochure', 'flyer', 'leaflet', 'poster', 'banner', 'standee', 'hoarding', 'sticker', 'label', 'packaging', 'booklet', 'card', 'envelope', 'event_collateral', 'dealer_kit', 'other'], default: 'other' },
  workspaceModule: { type: String, enum: ['project', 'campaign', 'task', 'standalone'], default: 'standalone' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  contentItem: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentItem' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  designer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  printCoordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  vendorName: String,
  quantity: { type: Number, required: true, min: 1 },
  requiredDate: { type: Date, required: true },
  targetDispatchDate: Date,
  targetDeliveryDate: Date,
  actualDispatchDate: Date,
  actualDeliveryDate: Date,
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  specifications: {
    size: String,
    customSize: String,
    pages: Number,
    paperType: String,
    paperGSM: String,
    colorType: { type: String, enum: ['single_color', 'two_color', 'four_color', 'black_white', 'custom'], default: 'four_color' },
    printSide: { type: String, enum: ['single_side', 'double_side'], default: 'single_side' },
    binding: { type: String, enum: ['none', 'staple', 'perfect_binding', 'spiral', 'hard_bound', 'wiro', 'custom'], default: 'none' },
    lamination: { type: String, enum: ['none', 'gloss', 'matte', 'soft_touch', 'custom'], default: 'none' },
    finishing: [{ type: String, enum: ['cutting', 'creasing', 'folding', 'embossing', 'debossing', 'foiling', 'spot_uv', 'die_cut', 'pasting', 'numbering', 'custom'] }],
    packagingRequired: { type: Boolean, default: false },
    packagingInstructions: String
  },
  artwork: {
    sourceFile: fileRefSchema,
    finalPrintFile: fileRefSchema,
    proofFile: fileRefSchema,
    artworkStatus: { type: String, enum: ['not_started', 'in_design', 'ready_for_review', 'approved', 'changes_required', 'final_file_uploaded'], default: 'not_started' },
    artworkVersion: { type: Number, default: 1 }
  },
  approval: {
    artworkApprovalRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalRequest' },
    printApprovalRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalRequest' },
    status: { type: String, enum: ['not_required', 'artwork_pending', 'artwork_approved', 'print_pending', 'approved', 'rejected', 'changes_requested'], default: 'not_required' }
  },
  quotation: {
    selectedQuotation: { type: mongoose.Schema.Types.ObjectId, ref: 'PrintJobQuotation' },
    estimatedCost: { type: Number, default: 0 },
    approvedCost: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' }
  },
  budget: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget' },
  expense: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' },
  status: { type: String, enum: ['draft', 'spec_pending', 'artwork_pending', 'artwork_review', 'artwork_approved', 'quotation_pending', 'quotation_selected', 'print_approval_pending', 'sent_to_vendor', 'proof_pending', 'proof_review', 'proof_approved', 'in_production', 'ready_for_dispatch', 'dispatched', 'delivered', 'quality_check', 'completed', 'on_hold', 'cancelled', 'reprint_required', 'archived'], default: 'draft' },
  deliveryAddress: addressSchema,
  production: {
    startedAt: Date,
    printingCompletedAt: Date,
    finishingCompletedAt: Date,
    packagingCompletedAt: Date,
    readyForDispatchAt: Date,
    vendorUpdateNotes: String
  },
  notes: String,
  tags: [String],
  isReprint: { type: Boolean, default: false },
  originalPrintJob: { type: mongoose.Schema.Types.ObjectId, ref: 'PrintJob' },
  reprintReason: String,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

schema.index({ workspace: 1, printJobNumber: 1 }, { unique: true });
schema.index({ workspace: 1, status: 1 });
schema.index({ workspace: 1, printJobType: 1 });
schema.index({ workspace: 1, project: 1 });
schema.index({ workspace: 1, campaign: 1 });
schema.index({ workspace: 1, vendor: 1 });
schema.index({ workspace: 1, requiredDate: 1 });
schema.index({ workspace: 1, printCoordinator: 1 });

module.exports = mongoose.models.PrintJob || mongoose.model('PrintJob', schema);
