import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { 
    type: String, 
    required: true
  },
  phone: { type: String },
  role: { type: String, enum: ['user', 'owner', 'admin', 'sub_admin'], default: 'user' },
  created_at: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'blocked', 'pending'], default: 'active' },
  data_consent: { type: Boolean, default: false },
  consent_date: { type: Date },
  tenantId: {
    type: String,
    required: false,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
  loginCount: {
    type: Number,
    default: 0
  },
  profilePhoto: {
    type: String
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerifiedAt: {
    type: Date
  },
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
