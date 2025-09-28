import mongoose from 'mongoose';

const gdprConsentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  consentGiven: { type: Boolean, default: false },
  consentDate: { type: Date },
  consentType: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

const GDPRConsent = mongoose.model('GDPRConsent', gdprConsentSchema);
export default GDPRConsent;
