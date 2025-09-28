import mongoose from 'mongoose';

const OfferSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Main offer title
  name: { type: String, required: true }, // Alternative name field
  description: { type: String, required: true },
  discount: { type: String, required: true }, // e.g., "20%", "₹500 off"
  validUntil: { type: Date, required: true }, // Offer expiry date
  type: { 
    type: String, 
    enum: ['pg', 'room', 'both'], 
    default: 'both' 
  }, // Type of offer
  images: [{ type: String }], // Multiple image URLs
  imageUrl: { type: String }, // Primary image URL for backward compatibility
  isActive: { type: Boolean, default: true },
  active: { type: Boolean, default: true }, // Alternative active field for compatibility
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware to sync active and isActive fields
OfferSchema.pre('save', function(next) {
  this.active = this.isActive;
  this.updatedAt = new Date();
  next();
});

// Virtual field for ID compatibility
OfferSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

OfferSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('Offer', OfferSchema);
