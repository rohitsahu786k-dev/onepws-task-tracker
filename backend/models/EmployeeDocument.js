const mongoose = require('mongoose');

const { Schema } = mongoose;

const employeeDocumentSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    employee: { type: Schema.Types.ObjectId, ref: 'EmployeeProfile', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    documentType: { type: String, enum: ['resume', 'id_proof', 'offer_letter', 'appointment_letter', 'nda', 'certificate', 'portfolio', 'other'], default: 'other' },
    title: { type: String, required: true },
    mediaFile: { type: Schema.Types.ObjectId, ref: 'MediaFile' },
    fileName: String,
    visibility: { type: String, enum: ['admin_only', 'manager', 'employee', 'workspace'], default: 'admin_only' },
    expiryDate: Date,
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

employeeDocumentSchema.index({ workspace: 1, employee: 1 });
employeeDocumentSchema.index({ workspace: 1, documentType: 1 });
employeeDocumentSchema.index({ workspace: 1, expiryDate: 1 });

module.exports = mongoose.models.EmployeeDocument || mongoose.model('EmployeeDocument', employeeDocumentSchema);
