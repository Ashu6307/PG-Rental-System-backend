import mongoose from 'mongoose';

const OwnerProfileSchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  business_type: { type: String, enum: ['PG', 'Room', 'Flat', 'All'], required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  avatar: { type: String }, // profile image URL
  KYC_docs: [{ type: String }], // URLs to uploaded docs
  KYC_status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  approval_status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejection_reason: { type: String },
  auditLogs: [{
    date: { type: Date, default: Date.now },
    action: { type: String },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    remarks: { type: String }
  }],
  consent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('OwnerProfile', OwnerProfileSchema);
