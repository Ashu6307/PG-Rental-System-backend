import mongoose from 'mongoose';

const OtpAuditSchema = new mongoose.Schema({
  email: { type: String, required: true },
  action: { type: String, required: true }, // send, verify, fail, expire, resend
  status: { type: String, required: true }, // success, error
  message: { type: String },
  createdAt: { type: Date, default: Date.now },
  ip: { type: String },
});

const OtpAudit = mongoose.model('OtpAudit', OtpAuditSchema);
export default OtpAudit;
