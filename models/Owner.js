import mongoose from 'mongoose';

const OwnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['owner'], default: 'owner' },
  businessName: { type: String },
  contactNumber: { type: String },
  created_at: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'blocked', 'pending'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
}, { timestamps: true });

export default mongoose.model('Owner', OwnerSchema);
