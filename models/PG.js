import mongoose from 'mongoose';

// Advanced Industry-Level PG Model with Complete Business Features
const pgSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  
  // Enhanced Location with GeoJSON
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [{ type: Number, required: true }], // [lng, lat]
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  
  // Business Information
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contactNumber: { type: String, required: true },
  email: { type: String },
  rooms: { type: Number, required: true },
  availableRooms: { type: Number, default: 0 },
  
  // Enhanced Pricing Structure (Legacy support + New Room Types)
  price: { type: Number, required: true }, // Legacy: main price for backward compatibility
  originalPrice: { type: Number },
  priceType: { type: String, enum: ['monthly', 'daily', 'weekly'], default: 'monthly' },
  pgType: { type: String, enum: ['Single', 'Double', 'Triple', 'Four'], default: 'Single' }, // Legacy
  deposit: { type: Number },
  
  // NEW: Multiple Room Types Support
  roomTypes: [{
    id: { type: String, required: true }, // e.g., 'single-ac', 'double-sharing'
    type: { type: String, required: true }, // e.g., 'Single AC', 'Double Sharing'
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    deposit: { type: Number },
    totalRooms: { type: Number, required: true },
    availableRooms: { type: Number, default: 0 },
    
    // Room-specific details
    amenities: [{ type: String }], // Room-specific amenities
    features: [{ type: String }], // Room-specific features
    images: [{ 
      url: { type: String },
      caption: { type: String }
    }],
    
    // Room specifications
    area: { type: Number }, // in sqft
    furnished: { type: Boolean, default: false },
    acAvailable: { type: Boolean, default: false },
    attachedBathroom: { type: Boolean, default: false },
    balcony: { type: Boolean, default: false },
    
    // Pricing variations
    weeklyDiscount: { type: Number, default: 0 }, // percentage
    monthlyDiscount: { type: Number, default: 0 }, // percentage
    
    isActive: { type: Boolean, default: true }
  }],
  
  // Auto-calculated price range (for display)
  priceRange: {
    min: { type: Number },
    max: { type: Number }
  },
  
  // Status and Featured
  status: { type: String, enum: ['active', 'inactive', 'pending', 'rejected'], default: 'pending' },
  featured: { type: Boolean, default: false },
  
  // Enhanced Image Management
  images: [{
    url: { type: String, required: true },
    caption: { type: String },
    isPrimary: { type: Boolean, default: false }
  }],
  
  // Amenities and Rules
  amenities: [{ type: String }],
  rules: [{ type: String }],
  
  // Facilities
  furnished: { type: Boolean, default: false },
  foodIncluded: { type: Boolean, default: false },
  foodType: { type: String, enum: ['vegetarian', 'non-vegetarian', 'both', 'multi-cuisine'], default: 'vegetarian' },
  
  // Access Control
  genderAllowed: { type: String, enum: ['male', 'female', 'both'], default: 'both' },
  allowedVisitors: { type: Boolean, default: false },
  visitorPolicy: {
    timings: { type: String },
    idRequired: { type: Boolean, default: false }
  },
  
  // Parking Details
  parkingAvailable: { type: Boolean, default: false },
  parkingDetails: {
    twoWheeler: {
      available: { type: Boolean, default: false },
      charges: { type: Number, default: 0 }
    },
    fourWheeler: {
      available: { type: Boolean, default: false },
      charges: { type: Number, default: 0 }
    }
  },
  
  // Internet and WiFi
  wifiAvailable: { type: Boolean, default: false },
  wifiDetails: {
    speed: { type: String },
    coverage: { type: String }
  },
  
  // Air Conditioning
  acAvailable: { type: Boolean, default: false },
  
  // Laundry Services
  laundryAvailable: { type: Boolean, default: false },
  laundryDetails: {
    charges: { type: String },
    pickup: { type: String }
  },
  
  // Security Features
  security: { type: String },
  securityFeatures: [{ type: String }],
  cctv: { type: Boolean, default: false },
  fireSafety: { type: Boolean, default: false },
  petsAllowed: { type: Boolean, default: false },
  
  // Description and Highlights
  description: { type: String },
  highlights: [{ type: String }],
  
  // Enhanced Nearby Places
  nearby: [{
    name: { type: String },
    distance: { type: String },
    type: { type: String, enum: ['transport', 'shopping', 'healthcare', 'education', 'office', 'entertainment'] }
  }],
  
  // Document Management
  documents: [{
    type: { type: String, enum: ['trade_license', 'fire_safety_certificate', 'building_permit', 'tax_certificate'] },
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' }
  }],
  
  // Verification and Approval
  verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  verificationDetails: {
    verifiedBy: { type: String },
    verifiedAt: { type: Date },
    status: { type: String }
  },
  
  // Approval Logs
  approvalLogs: [{
    action: { type: String },
    by: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Soft Delete
  softDelete: { type: Boolean, default: false },
  
  // Utility Bills
  electricityBill: {
    included: { type: Boolean, default: false },
    type: { type: String, enum: ['fixed', 'individual', 'shared'], default: 'shared' },
    averageAmount: { type: Number }
  },
  waterBill: {
    included: { type: Boolean, default: true },
    type: { type: String, enum: ['unlimited', 'metered'], default: 'unlimited' }
  },
  internetBill: {
    included: { type: Boolean, default: true },
    provider: { type: String }
  },
  
  // Booking and Cancellation Policies
  bookingPolicy: {
    advanceRequired: { type: Boolean, default: true },
    advanceAmount: { type: Number },
    minimumStay: { type: String },
    noticePeriod: { type: String }
  },
  cancellationPolicy: {
    type: { type: String, enum: ['flexible', 'moderate', 'strict', 'student-friendly', 'executive'] },
    description: { type: String }
  },
  
  // Rating System
  rating: {
    overall: { type: Number, min: 0, max: 5, default: 0 },
    cleanliness: { type: Number, min: 0, max: 5, default: 0 },
    location: { type: Number, min: 0, max: 5, default: 0 },
    facilities: { type: Number, min: 0, max: 5, default: 0 },
    staff: { type: Number, min: 0, max: 5, default: 0 },
    valueForMoney: { type: Number, min: 0, max: 5, default: 0 }
  },
  
  // Reviews Summary
  reviews: {
    total: { type: Number, default: 0 },
    positive: { type: Number, default: 0 },
    negative: { type: Number, default: 0 }
  },
  
  // Occupancy Management
  occupancy: {
    current: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    occupancyRate: { type: Number, default: 0 }
  },
  
  // Discounts and Offers
  discounts: [{
    type: { type: String, enum: ['student', 'corporate', 'long_term', 'semester', 'monthly'] },
    description: { type: String },
    percentage: { type: Number, min: 0, max: 100 }
  }],
  
  // Contact Timings
  contactTimings: {
    office: { type: String },
    emergency: { type: String },
    viewings: { type: String }
  },
  
  // SEO Optimization
  seo: {
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: [{ type: String }],
    slug: { type: String }
  },
  
  // Analytics
  analytics: {
    views: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 }
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to calculate price range and update legacy fields
pgSchema.pre('save', function(next) {
  // Update timestamp
  this.updatedAt = Date.now();
  
  // Calculate price range from roomTypes if available
  if (this.roomTypes && this.roomTypes.length > 0) {
    const prices = this.roomTypes
      .filter(room => room.isActive !== false)
      .map(room => room.price);
    
    if (prices.length > 0) {
      this.priceRange = {
        min: Math.min(...prices),
        max: Math.max(...prices)
      };
      
      // Update legacy price field with minimum price for backward compatibility
      this.price = this.priceRange.min;
    }
    
    // Update total available rooms
    this.availableRooms = this.roomTypes
      .filter(room => room.isActive !== false)
      .reduce((total, room) => total + (room.availableRooms || 0), 0);
    
    // Update total rooms
    this.rooms = this.roomTypes
      .filter(room => room.isActive !== false)
      .reduce((total, room) => total + (room.totalRooms || 0), 0);
  }
  
  next();
});

// Method to get room type by ID
pgSchema.methods.getRoomType = function(roomTypeId) {
  return this.roomTypes.find(room => room.id === roomTypeId);
};

// Method to check room availability
pgSchema.methods.isRoomTypeAvailable = function(roomTypeId) {
  const roomType = this.getRoomType(roomTypeId);
  return roomType && roomType.availableRooms > 0 && roomType.isActive !== false;
};

// Method to get active room types
pgSchema.methods.getActiveRoomTypes = function() {
  return this.roomTypes.filter(room => room.isActive !== false);
};

export default mongoose.model('PG', pgSchema);
