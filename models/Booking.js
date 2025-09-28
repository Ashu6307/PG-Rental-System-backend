import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  item_type: { type: String, enum: ['PG', 'Room', 'Flat'], required: true },
  item_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  from_date: { type: Date, required: true },
  to_date: { type: Date, required: true },
  amount: { type: Number },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed', 'checkedin'], default: 'confirmed' },
  
  // Enhanced fields for dashboard
  bookingId: { type: String, unique: true },
  paymentStatus: { type: String, enum: ['pending', 'partial', 'paid', 'refunded'], default: 'pending' },
  checkInDate: { type: Date },
  checkOutDate: { type: Date },
  duration: { type: Number }, // in days
  totalAmount: { type: Number },
  advanceAmount: { type: Number, default: 0 },
  
  // Property details (cached for performance)
  propertyDetails: {
    name: String,
    address: String,
    images: [String],
    rating: Number,
    roomNumber: String,
    roomType: String
  },
  
  // Booking metadata
  bookingSource: { type: String, enum: ['web', 'mobile', 'admin'], default: 'web' },
  guestCount: { type: Number, default: 1 },
  specialRequests: String,
  
  // Timestamps
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  lastModified: { type: Date, default: Date.now }
});

// Indexes
BookingSchema.index({ user_id: 1, status: 1 });
BookingSchema.index({ bookingId: 1 });
BookingSchema.index({ from_date: 1, to_date: 1 });
BookingSchema.index({ created_at: -1 });

// Pre-save middleware
BookingSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  this.lastModified = Date.now();
  
  // Generate bookingId if not exists
  if (!this.bookingId) {
    this.bookingId = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  
  // Calculate duration
  if (this.from_date && this.to_date) {
    this.duration = Math.ceil((this.to_date - this.from_date) / (1000 * 60 * 60 * 24));
  }
  
  next();
});

export default mongoose.model('Booking', BookingSchema);
