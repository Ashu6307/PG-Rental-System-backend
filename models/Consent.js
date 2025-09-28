import mongoose from 'mongoose';

const ConsentSchema = new mongoose.Schema({
  email: { type: String, required: true },
  consentType: { type: String, required: true },
  details: { type: String },
  createdAt: { type: Date, default: Date.now },
  tenantId: { type: String },
});

const Consent = mongoose.model('Consent', ConsentSchema);
export default Consent;
