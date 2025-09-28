import mongoose from 'mongoose';

const FlatSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  
  // Owner Information
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Flat Specifications
  type: { type: String, enum: ['1BHK', '2BHK', '3BHK', '4BHK', 'Studio'], required: true },
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  area: { type: Number }, // in sq ft
  furnished: { type: String, enum: ['Fully Furnished', 'Semi Furnished', 'Unfurnished'], required: true },
  floor: { type: Number },
  totalFloors: { type: Number },
  
  // Pricing
  rent: { type: Number, required: true },
  deposit: { type: Number, required: true },
  maintenanceCharges: { type: Number, default: 0 },
  brokerage: { type: Number, default: 0 },
  
  // Amenities
  amenities: [{
    type: String,
    enum: [
      'Parking', 'Power Backup', 'Lift', 'Security', 'Garden', 'Gym',
      'Swimming Pool', 'Club House', 'Children Play Area', 'Internet',
      'AC', 'Fridge', 'Washing Machine', 'Microwave', 'TV', 'Geyser',
      'Sofa', 'Dining Table', 'Wardrobe', 'Balcony', 'Terrace'
    ]
  }],
  
  // Availability
  available: { type: Boolean, default: true },
  availableFrom: { type: Date },
  
  // Media
  images: [{ type: String }],
  virtualTour: { type: String },
  
  // Preferences
  preferredTenants: {
    type: String,
    enum: ['Family', 'Bachelor Male', 'Bachelor Female', 'Any'],
    default: 'Any'
  },
  petAllowed: { type: Boolean, default: false },
  smokingAllowed: { type: Boolean, default: false },
  
  // Contact
  contactNumber: { type: String, required: true },
  alternateNumber: { type: String },
  
  // Additional Info
  nearby: [{
    name: { type: String },
    distance: { type: String },
    type: { type: String }
  }],
  
  // Status and Management
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'inactive'], default: 'pending' },
  featured: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  priority: { type: Number, default: 0 },
  
  // Tracking
  views: { type: Number, default: 0 },
  inquiries: { type: Number, default: 0 },
  bookings: { type: Number, default: 0 },
  
  // Ratings
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  
  // Soft Delete
  softDelete: { type: Boolean, default: false },
  deletedAt: { type: Date },
  
}, { timestamps: true });

// Indexes for better performance
FlatSchema.index({ city: 1, status: 1 });
FlatSchema.index({ rent: 1 });
FlatSchema.index({ type: 1 });
FlatSchema.index({ location: '2dsphere' });
FlatSchema.index({ owner: 1 });

export default mongoose.model('Flat', FlatSchema);
