import mongoose from 'mongoose';

// Industry-Level Room & Flat Rental Model (Based on 99acres, MagicBricks, NoBroker)
const roomSchema = new mongoose.Schema({
  // Basic Property Information
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    required: true,
    maxlength: 2000
  },
  
  // Location Details (Industry Standard)
  address: { 
    type: String, 
    required: true,
    maxlength: 200
  },
  city: { 
    type: String, 
    required: true,
    index: true
  },
  locality: { 
    type: String, 
    required: true,
    index: true
  },
  subLocality: { type: String },
  state: { 
    type: String, 
    required: true 
  },
  pincode: { 
    type: String, 
    required: true,
    match: /^\d{6}$/
  },
  
  // Enhanced Location with GeoJSON
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [{ type: Number, required: true }], // [lng, lat]
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  
  // Property Type & Classification
  propertyType: { 
    type: String, 
    enum: ['Room', 'Flat'], 
    required: true,
    index: true
  },
  
  // Room Configuration (for Room properties)
  roomConfig: {
    roomType: { 
      type: String, 
      enum: ['Single Occupancy', 'Double Occupancy', 'Triple Occupancy', 'Family Room', 'Bachelor Room', 'Couple Room', 'Shared Room'],
      required: function() { return this.propertyType === 'Room'; }
    },
    occupancy: { 
      type: Number, 
      min: 1, 
      max: 6,
      required: function() { return this.propertyType === 'Room'; }
    },
    furnished: { 
      type: String, 
      enum: ['Fully Furnished', 'Semi Furnished', 'Unfurnished'],
      required: function() { return this.propertyType === 'Room'; }
    },
    attachedBathroom: { 
      type: Boolean, 
      default: false 
    },
    balcony: { 
      type: Boolean, 
      default: false 
    },
    area: { 
      type: Number, 
      min: 80, 
      max: 500 // sq ft
    }
  },
  
  // Flat Configuration (for Flat properties)
  flatConfig: {
    flatType: { 
      type: String, 
      enum: ['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK', 'Villa', 'Duplex', 'Penthouse'],
      required: function() { return this.propertyType === 'Flat'; }
    },
    bedrooms: { 
      type: Number, 
      min: 0, 
      max: 10,
      required: function() { return this.propertyType === 'Flat'; }
    },
    bathrooms: { 
      type: Number, 
      min: 1, 
      max: 8,
      required: function() { return this.propertyType === 'Flat'; }
    },
    balconies: { 
      type: Number, 
      min: 0, 
      max: 5,
      default: 0
    },
    
    // Kitchen Details
    kitchen: {
      type: { 
        type: String, 
        enum: ['Modular', 'Semi-modular', 'Basic', 'None'], 
        default: 'Basic' 
      },
      size: { 
        type: String, 
        enum: ['Large', 'Medium', 'Small', 'Compact'] 
      }
    },
    
    // Area Details
    builtupArea: { 
      type: Number, 
      min: 200, 
      max: 10000, // sq ft
      required: function() { return this.propertyType === 'Flat'; }
    },
    carpetArea: { 
      type: Number, 
      min: 150, 
      max: 8000 // sq ft
    },
    superBuiltupArea: { 
      type: Number 
    },
    
    // Building Details
    floorNumber: { 
      type: Number, 
      min: 0, 
      max: 50 
    },
    totalFloors: { 
      type: Number, 
      min: 1, 
      max: 50 
    },
    facing: { 
      type: String, 
      enum: ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'] 
    },
    
    // Furnishing Status
    furnishingStatus: { 
      type: String, 
      enum: ['Furnished', 'Semi-furnished', 'Unfurnished'],
      required: function() { return this.propertyType === 'Flat'; }
    },
    
    // Age of Property
    propertyAge: { 
      type: String, 
      enum: ['Under Construction', '0-1 Year', '1-5 Years', '5-10 Years', '10-15 Years', '15+ Years'] 
    },
    
    // Parking
    parking: {
      covered: { type: Number, default: 0 },
      open: { type: Number, default: 0 }
    }
  },
  
  // Business Information
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  
  // Availability & Inventory
  totalUnits: { 
    type: Number, 
    required: true,
    min: 1,
    max: 100
  },
  availableUnits: { 
    type: Number, 
    default: 0,
    min: 0
  },
  
  // Pricing Structure (Industry Standard)
  pricing: {
    rent: { 
      type: Number, 
      required: true,
      min: 1000,
      max: 500000,
      index: true
    },
    originalPrice: {
      type: Number,
      min: 0 // For discount calculation
    },
    securityDeposit: { 
      type: Number, 
      required: true,
      min: 0
    },
    maintenanceCharges: { 
      type: Number, 
      default: 0 
    },
    brokerageCharges: { 
      type: Number, 
      default: 0 
    },
    
    // Utility Charges
    electricityCharges: { 
      type: String, 
      enum: ['Included', 'Extra', 'As per usage'], 
      default: 'As per usage' 
    },
    electricityRate: {
      type: Number, // per unit in ₹
      default: 0
    },
    waterCharges: { 
      type: String, 
      enum: ['Included', 'Extra'], 
      default: 'Included' 
    },
    waterChargesAmount: {
      type: Number, // per month in ₹
      default: 0
    },
    internetCharges: { 
      type: String, 
      enum: ['Included', 'Extra', 'Not Available'], 
      default: 'Extra' 
    },
    internetChargesAmount: {
      type: Number, // per month in ₹
      default: 0
    },
    parkingCharges: {
      type: Number,
      default: 0 // per month in ₹, 0 means free
    },
    
    // Pricing Type
    priceType: { 
      type: String, 
      enum: ['Monthly', 'Daily', 'Weekly'], 
      default: 'Monthly' 
    },
    
    // Negotiability
    priceNegotiable: { 
      type: Boolean, 
      default: false 
    },
    
    // Offers & Discounts
    offerPrice: { type: Number },
    discountPercent: { type: Number, min: 0, max: 50 },
    offerValidTill: { type: Date },
    
    // Token Amount
    tokenAmount: { 
      type: Number, 
      default: 0 
    }
  },
  
  // Comprehensive Amenities (99acres/MagicBricks style)
  amenities: {
    // Basic Amenities
    basic: {
      powerBackup: { type: Boolean, default: false },
      waterSupply: { type: Boolean, default: true },
      lift: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      security: { type: Boolean, default: false },
      wifi: { type: Boolean, default: false },
      airConditioning: { type: Boolean, default: false }
    },
    
    // Room/Flat Specific
    room: {
      attached_bathroom: { type: Boolean, default: false },
      balcony: { type: Boolean, default: false },
      wardrobe: { type: Boolean, default: false },
      bed: { type: Boolean, default: false },
      studyTable: { type: Boolean, default: false },
      chair: { type: Boolean, default: false },
      fan: { type: Boolean, default: false },
      light: { type: Boolean, default: true }
    },
    
    // Kitchen Amenities (mainly for flats)
    kitchen: {
      modularKitchen: { type: Boolean, default: false },
      gasConnection: { type: Boolean, default: false },
      waterPurifier: { type: Boolean, default: false },
      refrigerator: { type: Boolean, default: false },
      microwaveOven: { type: Boolean, default: false },
      washingMachine: { type: Boolean, default: false },
      dishwasher: { type: Boolean, default: false },
      chimney: { type: Boolean, default: false }
    },
    
    // Society/Building Amenities
    society: {
      gym: { type: Boolean, default: false },
      swimmingPool: { type: Boolean, default: false },
      clubhouse: { type: Boolean, default: false },
      garden: { type: Boolean, default: false },
      kidsPlayArea: { type: Boolean, default: false },
      joggingTrack: { type: Boolean, default: false },
      communityHall: { type: Boolean, default: false },
      gatedSecurity: { type: Boolean, default: false },
      cctv: { type: Boolean, default: false },
      intercom: { type: Boolean, default: false }
    },
    
    // Additional Services
    services: {
      housekeeping: { type: Boolean, default: false },
      laundryService: { type: Boolean, default: false },
      foodService: { type: Boolean, default: false },
      maintenanceService: { type: Boolean, default: false },
      petAllowed: { type: Boolean, default: false }
    }
  },
  
  // Preferred Tenant & Rules (Industry Standard)
  tenantPreferences: {
    genderPreference: { 
      type: String, 
      enum: ['Male', 'Female', 'Any'], 
      default: 'Any',
      index: true
    },
    occupationType: {
      type: [String],
      enum: ['Family', 'Bachelor', 'Student', 'Working Professional', 'Couple'],
      default: ['Any']
    },
    foodPreference: {
      type: String,
      enum: ['Veg', 'Non-Veg', 'Both'],
      default: 'Both'
    },
    ageGroup: {
      min: { type: Number, default: 18 },
      max: { type: Number, default: 60 }
    }
  },
  
  // House Rules
  rules: {
    smokingAllowed: { type: Boolean, default: false },
    drinkingAllowed: { type: Boolean, default: false },
    petsAllowed: { type: Boolean, default: false },
    visitorsAllowed: { type: Boolean, default: true },
    partyAllowed: { type: Boolean, default: false },
    
    // Timing Rules
    curfewTime: { type: String }, // e.g., "11:00 PM"
    gateClosingTime: { type: String },
    
    // Notice Periods
    noticePeriod: { 
      type: Number, 
      default: 30, 
      min: 15, 
      max: 90 
    }, // days
    minimumStay: { 
      type: Number, 
      default: 1, 
      min: 1, 
      max: 24 
    }, // months
    
    // Additional Rules
    additionalRules: [{ type: String }]
  },
  
  // Nearby Places & Connectivity (MagicBricks style)
  nearbyPlaces: {
    transportation: [{
      name: { type: String },
      type: { 
        type: String, 
        enum: ['Metro Station', 'Bus Stop', 'Railway Station', 'Airport', 'Taxi Stand'] 
      },
      distance: { type: Number }, // in meters
      walkingTime: { type: Number } // in minutes
    }],
    
    healthcare: [{
      name: { type: String },
      type: { 
        type: String, 
        enum: ['Hospital', 'Clinic', 'Pharmacy', 'Diagnostic Center'] 
      },
      distance: { type: Number },
      walkingTime: { type: Number }
    }],
    
    education: [{
      name: { type: String },
      type: { 
        type: String, 
        enum: ['School', 'College', 'University', 'Coaching Center', 'Library'] 
      },
      distance: { type: Number },
      walkingTime: { type: Number }
    }],
    
    shopping: [{
      name: { type: String },
      type: { 
        type: String, 
        enum: ['Mall', 'Market', 'Supermarket', 'ATM', 'Bank'] 
      },
      distance: { type: Number },
      walkingTime: { type: Number }
    }],
    
    entertainment: [{
      name: { type: String },
      type: { 
        type: String, 
        enum: ['Cinema', 'Restaurant', 'Cafe', 'Park', 'Gym', 'Sports Complex'] 
      },
      distance: { type: Number },
      walkingTime: { type: Number }
    }]
  },
  
  // Media Management (Industry Standard)
  media: {
    images: [{
      url: { type: String, required: true },
      caption: { type: String },
      category: { 
        type: String, 
        enum: ['Main', 'Bedroom', 'Bathroom', 'Kitchen', 'Living Room', 'Balcony', 'Building', 'Society', 'Locality'],
        default: 'Main'
      },
      order: { type: Number, default: 0 },
      isMain: { type: Boolean, default: false }
    }],
    
    // Area-specific images for detailed view
    areaImages: {
      kitchen: [{ type: String }],
      bedroom: [{ type: String }],
      bathroom: [{ type: String }],
      livingRoom: [{ type: String }],
      balcony: [{ type: String }],
      parking: [{ type: String }],
      entrance: [{ type: String }],
      others: [{
        label: { type: String, required: true },
        images: [{ type: String }]
      }]
    },
    
    videos: [{
      url: { type: String },
      caption: { type: String },
      type: { 
        type: String, 
        enum: ['Property Tour', 'Drone View', 'Locality Tour'] 
      }
    }],
    
    virtualTour: {
      enabled: { type: Boolean, default: false },
      url: { type: String }
    },
    
    floorPlan: {
      available: { type: Boolean, default: false },
      images: [{ type: String }]
    }
  },
  
  // Contact Information
  contact: {
    primaryPhone: { 
      type: String, 
      required: true,
      match: /^[6-9]\d{9}$/
    },
    secondaryPhone: { 
      type: String,
      match: /^[6-9]\d{9}$/
    },
    whatsappNumber: { 
      type: String,
      match: /^[6-9]\d{9}$/
    },
    email: { 
      type: String,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    
    // Availability for contact
    contactAvailability: {
      timeSlots: [{
        day: { 
          type: String, 
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] 
        },
        startTime: { type: String },
        endTime: { type: String }
      }],
      preferredContactMethod: { 
        type: String, 
        enum: ['Phone', 'WhatsApp', 'Email'], 
        default: 'Phone' 
      }
    }
  },
  
  // Property Status & Verification
  propertyStatus: {
    listingStatus: { 
      type: String, 
      enum: ['Active', 'Inactive', 'Pending', 'Suspended', 'Rented', 'Under Maintenance'], 
      default: 'Pending',
      index: true
    },
    verified: { 
      type: Boolean, 
      default: false,
      index: true
    },
    featured: { 
      type: Boolean, 
      default: false,
      index: true
    },
    premium: { 
      type: Boolean, 
      default: false 
    },
    
    // Verification Details
    verifiedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Admin' 
    },
    verifiedAt: { type: Date },
    verificationNotes: { type: String },
    
    // Property Quality Score (based on completeness, images, etc.)
    qualityScore: { 
      type: Number, 
      default: 0, 
      min: 0, 
      max: 100 
    }
  },
  
  // Advanced Analytics & Performance
  analytics: {
    views: { 
      total: { type: Number, default: 0 },
      thisMonth: { type: Number, default: 0 },
      thisWeek: { type: Number, default: 0 }
    },
    inquiries: { 
      total: { type: Number, default: 0 },
      thisMonth: { type: Number, default: 0 }
    },
    shortlisted: { type: Number, default: 0 },
    
    // Response Metrics
    responseRate: { type: Number, default: 0 }, // %
    averageResponseTime: { type: Number, default: 0 }, // hours
    
    // Performance Score
    searchRanking: { type: Number, default: 0 },
    popularityScore: { type: Number, default: 0 }
  },
  
  // Review & Rating System
  reviews: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    },
    rating: { 
      type: Number, 
      min: 1, 
      max: 5, 
      required: true 
    },
    review: { 
      type: String, 
      maxlength: 1000 
    },
    
    // Category-wise ratings
    categoryRatings: {
      location: { type: Number, min: 1, max: 5 },
      amenities: { type: Number, min: 1, max: 5 },
      maintenance: { type: Number, min: 1, max: 5 },
      valueForMoney: { type: Number, min: 1, max: 5 },
      ownerBehavior: { type: Number, min: 1, max: 5 }
    },
    
    // Review metadata
    helpful: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }],
    reported: { type: Boolean, default: false },
    approved: { type: Boolean, default: true },
    
    createdAt: { type: Date, default: Date.now },
    
    // Owner Response
    ownerResponse: {
      text: { type: String },
      respondedAt: { type: Date },
      respondedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
      }
    }
  }],
  
  // Overall Rating & Review Summary
  rating: {
    overall: { type: Number, min: 1, max: 5, default: 0 },
    cleanliness: { type: Number, min: 1, max: 5, default: 0 },
    location: { type: Number, min: 1, max: 5, default: 0 },
    facilities: { type: Number, min: 1, max: 5, default: 0 },
    staff: { type: Number, min: 1, max: 5, default: 0 },
    valueForMoney: { type: Number, min: 1, max: 5, default: 0 }
  },
  
  reviewSummary: {
    totalReviews: { type: Number, default: 0 },
    averageRating: { type: Number, min: 1, max: 5, default: 0 },
    ratingDistribution: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    }
  },
  
  // SEO & Marketing
  seo: {
    metaTitle: { 
      type: String, 
      maxlength: 60 
    },
    metaDescription: { 
      type: String, 
      maxlength: 160 
    },
    keywords: [{ type: String }],
    slug: { 
      type: String, 
      unique: true,
      index: true
    },
    
    // Search optimization
    searchKeywords: [{ type: String }],
    locality_tags: [{ type: String }]
  },
  
  // Legal & Compliance
  legal: {
    agreementType: { 
      type: String, 
      enum: ['Rental Agreement', 'Leave & License', 'Lease Deed'], 
      default: 'Rental Agreement' 
    },
    
    // Document Requirements
    documentsRequired: {
      aadhaarCard: { type: Boolean, default: true },
      panCard: { type: Boolean, default: false },
      salarySlip: { type: Boolean, default: false },
      bankStatement: { type: Boolean, default: false },
      companyId: { type: Boolean, default: false },
      policeClearance: { type: Boolean, default: false }
    },
    
    // Owner Documents
    ownerDocuments: {
      propertyPapers: { type: Boolean, default: false },
      societyNoc: { type: Boolean, default: false },
      rentAgreementFormat: { type: Boolean, default: false }
    }
  },
  
  // Booking & Scheduling
  booking: {
    instantBooking: { type: Boolean, default: false },
    scheduleVisit: { type: Boolean, default: true },
    
    // Availability for visits
    visitSchedule: {
      availableDays: [{
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      }],
      timeSlots: [{
        startTime: { type: String },
        endTime: { type: String }
      }]
    },
    
    // Advance booking
    advanceBookingDays: { 
      type: Number, 
      default: 7,
      min: 1, 
      max: 30 
    }
  },
  
  // Timestamps & Metadata
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  publishedAt: { type: Date },
  lastActiveAt: { type: Date },
  
  // Version Control
  version: { type: Number, default: 1 },
  
  // Admin Fields
  adminNotes: { type: String },
  moderationStatus: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Flagged'], 
    default: 'Pending' 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Performance Indexes (Industry Best Practices)
roomSchema.index({ location: '2dsphere' });
roomSchema.index({ 'pricing.rent': 1, propertyType: 1, 'propertyStatus.listingStatus': 1 });
roomSchema.index({ city: 1, locality: 1, propertyType: 1 });
roomSchema.index({ 'tenantPreferences.genderPreference': 1, propertyType: 1 });
roomSchema.index({ 'propertyStatus.featured': -1, 'propertyStatus.verified': -1, createdAt: -1 });
roomSchema.index({ owner: 1, 'propertyStatus.listingStatus': 1 });
roomSchema.index({ 'seo.slug': 1 });
roomSchema.index({ 'analytics.views.total': -1 });

// Virtual Fields (Computed Properties)
roomSchema.virtual('averageRating').get(function() {
  if (this.reviews && this.reviews.length > 0) {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / this.reviews.length).toFixed(1);
  }
  return 0;
});

roomSchema.virtual('occupancyPercentage').get(function() {
  if (this.totalUnits > 0) {
    return (((this.totalUnits - this.availableUnits) / this.totalUnits) * 100).toFixed(1);
  }
  return 0;
});

roomSchema.virtual('pricePerSqFt').get(function() {
  if (this.propertyType === 'Flat' && this.flatConfig.carpetArea) {
    return (this.pricing.rent / this.flatConfig.carpetArea).toFixed(2);
  }
  if (this.propertyType === 'Room' && this.roomConfig.area) {
    return (this.pricing.rent / this.roomConfig.area).toFixed(2);
  }
  return 0;
});

roomSchema.virtual('isAvailable').get(function() {
  return this.availableUnits > 0 && this.propertyStatus.listingStatus === 'Active';
});

// Pre-save Middleware
roomSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-generate slug
  if (!this.seo.slug) {
    const baseSlug = `${this.name}-${this.locality}-${this.city}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    this.seo.slug = `${baseSlug}-${this._id.toString().slice(-6)}`;
  }
  
  // Calculate quality score
  this.propertyStatus.qualityScore = this.calculateQualityScore();
  
  next();
});

// Instance Methods
roomSchema.methods.calculateQualityScore = function() {
  let score = 0;
  
  // Basic info completeness (30 points)
  if (this.description && this.description.length > 50) score += 10;
  if (this.media.images.length >= 3) score += 15;
  if (this.media.images.length >= 6) score += 5;
  
  // Contact info (15 points)
  if (this.contact.primaryPhone) score += 5;
  if (this.contact.whatsappNumber) score += 5;
  if (this.contact.email) score += 5;
  
  // Amenities (20 points)
  const amenityCount = Object.values(this.amenities.basic).filter(Boolean).length +
                      Object.values(this.amenities.room).filter(Boolean).length;
  score += Math.min(amenityCount * 2, 20);
  
  // Nearby places (15 points)
  const nearbyCount = Object.values(this.nearbyPlaces).reduce((acc, arr) => acc + arr.length, 0);
  score += Math.min(nearbyCount, 15);
  
  // Verification & status (20 points)
  if (this.propertyStatus.verified) score += 15;
  if (this.legal.ownerDocuments.propertyPapers) score += 5;
  
  return Math.min(score, 100);
};

roomSchema.methods.addReview = function(userId, rating, reviewText, categoryRatings) {
  this.reviews.push({
    user: userId,
    rating: rating,
    review: reviewText,
    categoryRatings: categoryRatings,
    createdAt: new Date()
  });
  
  return this.save();
};

// Static Methods for Advanced Queries
roomSchema.statics.findByLocation = function(lat, lng, radius = 5000, filters = {}) {
  const query = {
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radius
      }
    },
    'propertyStatus.listingStatus': 'Active',
    ...filters
  };
  
  return this.find(query)
    .populate('owner', 'name email phone verified businessType')
    .sort({ 'propertyStatus.featured': -1, 'analytics.views.total': -1 });
};

roomSchema.statics.findWithAdvancedFilters = function(filters) {
  const query = { 'propertyStatus.listingStatus': 'Active' };
  
  // Location filters
  if (filters.city) query.city = new RegExp(filters.city, 'i');
  if (filters.locality) query.locality = new RegExp(filters.locality, 'i');
  
  // Price filters
  if (filters.minRent || filters.maxRent) {
    query['pricing.rent'] = {};
    if (filters.minRent) query['pricing.rent'].$gte = filters.minRent;
    if (filters.maxRent) query['pricing.rent'].$lte = filters.maxRent;
  }
  
  // Property type filters
  if (filters.propertyType) query.propertyType = filters.propertyType;
  
  // Room specific filters
  if (filters.propertyType === 'Room') {
    if (filters.roomType) query['roomConfig.roomType'] = filters.roomType;
    if (filters.furnished) query['roomConfig.furnished'] = filters.furnished;
  }
  
  // Flat specific filters
  if (filters.propertyType === 'Flat') {
    if (filters.flatType) query['flatConfig.flatType'] = filters.flatType;
    if (filters.bedrooms) query['flatConfig.bedrooms'] = filters.bedrooms;
    if (filters.furnishingStatus) query['flatConfig.furnishingStatus'] = filters.furnishingStatus;
  }
  
  // Tenant preferences
  if (filters.genderPreference) {
    query['tenantPreferences.genderPreference'] = { $in: [filters.genderPreference, 'Any'] };
  }
  
  // Amenity filters
  if (filters.amenities && filters.amenities.length > 0) {
    const amenityQueries = [];
    filters.amenities.forEach(amenity => {
      amenityQueries.push(
        { [`amenities.basic.${amenity}`]: true },
        { [`amenities.room.${amenity}`]: true },
        { [`amenities.kitchen.${amenity}`]: true },
        { [`amenities.society.${amenity}`]: true }
      );
    });
    query.$or = amenityQueries;
  }
  
  // Availability filter
  if (filters.availableOnly) query.availableUnits = { $gt: 0 };
  
  // Verification filter
  if (filters.verifiedOnly) query['propertyStatus.verified'] = true;
  
  return this.find(query)
    .populate('owner', 'name email phone verified businessType')
    .sort({ 
      'propertyStatus.featured': -1, 
      'propertyStatus.verified': -1,
      'analytics.popularityScore': -1,
      createdAt: -1 
    });
};

// Export the model
const Room = mongoose.model('Room', roomSchema);
export default Room;
