import mongoose from 'mongoose';

const CTAContentSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  description: { type: String },
  buttonText: { type: String },
  buttonLink: { type: String },
  tenantId: { type: String },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('CTAContent', CTAContentSchema);
