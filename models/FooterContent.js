import mongoose from 'mongoose';

const FooterContentSchema = new mongoose.Schema({
  contactInfo: { type: String },
  socialLinks: [{ type: String }],
  copyright: { type: String },
  tenantId: { type: String },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('FooterContent', FooterContentSchema);
