import mongoose from 'mongoose';

const FeaturedListingSchema = new mongoose.Schema({
  type: { type: String, enum: ['pg', 'room', 'flat'], required: true },
  refId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'type' },
  isFeatured: { type: Boolean, default: true },
  tenantId: { type: String },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('FeaturedListing', FeaturedListingSchema);
