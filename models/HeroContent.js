import mongoose from 'mongoose';

const HeroContentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  image: { type: String }, // Single image (backward compatibility)
  images: [{ type: String }], // Multiple images array for carousel
  ctaText: { type: String },
  tenantId: { type: String },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('HeroContent', HeroContentSchema);
