import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  used: { type: Boolean, default: false },
  usedAt: { type: Date },
  role: { type: String, default: 'user' }, // user, owner, admin
  createdAt: { type: Date, default: Date.now },
});

const Otp = mongoose.model('Otp', OtpSchema);
export default Otp;
