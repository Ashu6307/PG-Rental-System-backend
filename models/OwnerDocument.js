import mongoose from 'mongoose';

const OwnerDocumentSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'OwnerProfile', required: true },
  type: { type: String, enum: ['Aadhaar', 'PAN', 'GST', 'RentalAgreement', 'Insurance', 'Other'], required: true },
  fileUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'verified', 'rejected', 'expired'], default: 'pending' },
  remarks: { type: String },
  expiryDate: { type: Date },
  uploadedAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  auditLogs: [{
    date: { type: Date, default: Date.now },
    action: { type: String },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    remarks: { type: String }
  }],
  consent: { type: Boolean, default: false }
});

export default mongoose.model('OwnerDocument', OwnerDocumentSchema);
