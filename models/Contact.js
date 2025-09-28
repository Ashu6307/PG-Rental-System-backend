import mongoose from 'mongoose';
const AttachmentSchema = new mongoose.Schema({
  filename: String,
  url: String,
  mimetype: String,
  size: Number
}, { _id: false });

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: {
    type: mongoose.Schema.Types.Mixed, // can be string or object { primary, whatsapp }
    required: true
  },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  inquiryType: { type: String, enum: ['general', 'pg_accommodation', 'room_rental', 'flat_rental', 'support', 'complaint', 'partnership'], default: 'general' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  attachments: [AttachmentSchema],
  status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'closed'], default: 'pending' },
  audit: {
    createdBy: { type: String },
    updatedBy: { type: String },
    updatedAt: { type: Date }
  },
  documentVerification: {
    verified: { type: Boolean, default: false },
    verifiedBy: { type: String },
    verifiedAt: { type: Date }
  },
  createdAt: { type: Date, default: Date.now }
});
const Contact = mongoose.model('Contact', ContactSchema);
export default Contact;