import mongoose from 'mongoose';

// Complete Tenant Tracking System for Owner Dashboard
const TenantTrackingSchema = new mongoose.Schema({
  // Basic Information
  tenantId: {
    type: String,
    unique: true,
    required: true,
    default: () => `TNT${Date.now()}${Math.floor(Math.random() * 1000)}`
  },
  
  // Tenant Details
  personalInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female'], required: true },
    occupation: { type: String },
    company: { type: String },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String }
    },
    address: {
      permanent: { type: String },
      current: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String }
    }
  },
  
  // Property Assignment
  property: {
    propertyId: { type: mongoose.Schema.Types.ObjectId, required: true },
    propertyType: { type: String, enum: ['PG', 'Room', 'Flat'], required: true },
    propertyName: { type: String, required: true },
    roomNumber: { type: String, required: true },
    bedNumber: { type: String }, // For shared rooms
    floor: { type: String },
    area: { type: String }
  },
  
  // Owner Information
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Check-in/Check-out Tracking
  stayDetails: {
    checkInDate: { type: Date, required: true },
    expectedCheckOutDate: { type: Date },
    actualCheckOutDate: { type: Date },
    checkInTime: { type: String },
    checkOutTime: { type: String },
    totalStayDays: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    
    // Check-in Process
    checkInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Owner or admin who did check-in
    },
    checkInNotes: { type: String },
    checkInPhotos: [{ type: String }], // Photo documentation
    
    // Check-out Process
    checkOutBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checkOutNotes: { type: String },
    checkOutPhotos: [{ type: String }],
    checkOutReason: {
      type: String,
      enum: ['lease_ended', 'job_change', 'unsatisfied', 'financial', 'family', 'other']
    }
  },
  
  // Financial Information
  financials: {
    monthlyRent: { type: Number, required: true },
    securityDeposit: { type: Number, required: true },
    advanceRent: { type: Number, default: 0 },
    
    // Payment History
    payments: [{
      date: { type: Date, required: true },
      amount: { type: Number, required: true },
      type: { type: String, enum: ['rent', 'deposit', 'electricity', 'other'], required: true },
      method: { type: String, enum: ['cash', 'online', 'cheque', 'upi'] },
      transactionId: { type: String },
      notes: { type: String },
      receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    
    // Dues and Outstanding
    currentDues: {
      rent: { type: Number, default: 0 },
      electricity: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now }
    },
    
    // Deposit Status
    depositStatus: {
      received: { type: Number, default: 0 },
      adjusted: { type: Number, default: 0 },
      refundable: { type: Number, default: 0 },
      refunded: { type: Number, default: 0 },
      refundDate: { type: Date }
    }
  },
  
  // Documents
  documents: {
    idProof: {
      type: { type: String, enum: ['aadhar', 'pan', 'passport', 'voter_id', 'driving_license'] },
      number: { type: String },
      frontImage: { type: String },
      backImage: { type: String },
      verified: { type: Boolean, default: false }
    },
    addressProof: {
      type: { type: String, enum: ['aadhar', 'utility_bill', 'rent_agreement', 'bank_statement'] },
      image: { type: String },
      verified: { type: Boolean, default: false }
    },
    photo: { type: String },
    agreement: {
      signed: { type: Boolean, default: false },
      signedDate: { type: Date },
      agreementFile: { type: String }
    }
  },
  
  // Room/Bed Sharing Details
  sharingDetails: {
    sharingType: { type: String, enum: ['single', 'double', 'triple', 'multiple'] },
    totalBedsInRoom: { type: Number },
    currentOccupancy: { type: Number },
    roommates: [{
      tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'TenantTracking' },
      name: { type: String },
      checkInDate: { type: Date },
      isActive: { type: Boolean, default: true }
    }]
  },
  
  // Electricity Billing Integration
  electricityTracking: {
    meterAssigned: { type: Boolean, default: false },
    meterNumber: { type: String },
    sharingElectricity: { type: Boolean, default: true },
    electricityBills: [{
      billId: { type: mongoose.Schema.Types.ObjectId, ref: 'ElectricityBill' },
      month: { type: String },
      consumption: { type: Number },
      amount: { type: Number },
      paid: { type: Boolean, default: false },
      paidDate: { type: Date }
    }]
  },
  
  // Behavior and Preferences
  tenantProfile: {
    // Behavioral Notes
    behavior: {
      punctuality: { type: String, enum: ['excellent', 'good', 'average', 'poor'] },
      cleanliness: { type: String, enum: ['excellent', 'good', 'average', 'poor'] },
      cooperation: { type: String, enum: ['excellent', 'good', 'average', 'poor'] },
      notes: { type: String }
    },
    
    // Preferences
    preferences: {
      foodType: { type: String, enum: ['veg', 'non-veg', 'both'] },
      smokingHabits: { type: String, enum: ['non-smoker', 'occasional', 'regular'] },
      drinkingHabits: { type: String, enum: ['non-drinker', 'occasional', 'regular'] },
      sleepSchedule: { type: String, enum: ['early_bird', 'night_owl', 'flexible'] },
      musicPreference: { type: String, enum: ['quiet', 'moderate', 'loud'] },
      guestPolicy: { type: String, enum: ['no_guests', 'occasional', 'frequent'] }
    },
    
    // Issues and Complaints
    issues: [{
      date: { type: Date, default: Date.now },
      type: { type: String, enum: ['payment', 'behavior', 'maintenance', 'noise', 'cleanliness', 'other'] },
      description: { type: String },
      severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
      resolved: { type: Boolean, default: false },
      resolvedDate: { type: Date },
      resolution: { type: String }
    }]
  },
  
  // Maintenance Requests
  maintenanceRequests: [{
    requestId: { type: String, unique: true },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['electrical', 'plumbing', 'cleaning', 'repair', 'other'] },
    description: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
    assignedTo: { type: String }, // Vendor or maintenance person
    cost: { type: Number },
    completedDate: { type: Date },
    photos: [{ type: String }],
    tenantSatisfaction: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: { type: String }
    }
  }],
  
  // Communication History
  communications: [{
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['call', 'message', 'email', 'in_person'] },
    purpose: { type: String, enum: ['payment_reminder', 'maintenance', 'complaint', 'general', 'emergency'] },
    notes: { type: String },
    followUpRequired: { type: Boolean, default: false },
    followUpDate: { type: Date }
  }],
  
  // Visit History (for potential tenants)
  visitHistory: [{
    visitDate: { type: Date },
    visitTime: { type: String },
    purpose: { type: String, enum: ['room_viewing', 'document_submission', 'payment', 'other'] },
    accompanied: { type: String }, // Who came with them
    notes: { type: String },
    outcome: { type: String, enum: ['interested', 'not_interested', 'decided', 'thinking'] }
  }],
  
  // Referral Information
  referral: {
    referredBy: {
      type: { type: String, enum: ['existing_tenant', 'friend', 'family', 'online', 'broker', 'walk_in'] },
      referrerName: { type: String },
      referrerContact: { type: String }
    },
    referralReward: {
      applicable: { type: Boolean, default: false },
      amount: { type: Number },
      given: { type: Boolean, default: false }
    }
  },
  
  // System Fields
  status: {
    type: String,
    enum: ['active', 'inactive', 'notice_period', 'vacated', 'blacklisted'],
    default: 'active'
  },
  
  // Automated Calculations
  analytics: {
    totalRevenue: { type: Number, default: 0 },
    averageMonthlyRevenue: { type: Number, default: 0 },
    totalStayDays: { type: Number, default: 0 },
    paymentDelayDays: { type: Number, default: 0 },
    maintenanceRequests: { type: Number, default: 0 },
    lastPaymentDate: { type: Date },
    nextDueDate: { type: Date }
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastActivityDate: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for better performance
TenantTrackingSchema.index({ tenantId: 1 });
TenantTrackingSchema.index({ owner: 1, status: 1 });
TenantTrackingSchema.index({ 'property.propertyId': 1, 'property.roomNumber': 1 });
TenantTrackingSchema.index({ 'personalInfo.phone': 1 });
TenantTrackingSchema.index({ 'personalInfo.email': 1 });
TenantTrackingSchema.index({ 'stayDetails.checkInDate': -1 });
TenantTrackingSchema.index({ 'stayDetails.isActive': 1 });
TenantTrackingSchema.index({ status: 1, owner: 1 });

// Virtual for current age calculation
TenantTrackingSchema.virtual('currentAge').get(function() {
  if (this.personalInfo.age) {
    const yearsFromCheckIn = Math.floor((Date.now() - this.stayDetails.checkInDate) / (365.25 * 24 * 60 * 60 * 1000));
    return this.personalInfo.age + yearsFromCheckIn;
  }
  return null;
});

// Virtual for current stay duration
TenantTrackingSchema.virtual('currentStayDuration').get(function() {
  if (this.stayDetails.isActive) {
    return Math.floor((Date.now() - this.stayDetails.checkInDate) / (24 * 60 * 60 * 1000));
  }
  return this.stayDetails.totalStayDays;
});

// Virtual for total outstanding amount
TenantTrackingSchema.virtual('totalOutstanding').get(function() {
  return this.financials.currentDues.total || 0;
});

// Static Methods
TenantTrackingSchema.statics.getOwnerTenants = function(ownerId, filters = {}) {
  const query = { owner: ownerId };
  
  if (filters.status) query.status = filters.status;
  if (filters.propertyId) query['property.propertyId'] = filters.propertyId;
  if (filters.roomNumber) query['property.roomNumber'] = filters.roomNumber;
  if (filters.isActive !== undefined) query['stayDetails.isActive'] = filters.isActive;
  
  return this.find(query)
    .populate('property.propertyId', 'name address')
    .sort({ 'stayDetails.checkInDate': -1 });
};

TenantTrackingSchema.statics.getTenantsByProperty = function(propertyId, roomNumber = null) {
  const query = { 'property.propertyId': propertyId, 'stayDetails.isActive': true };
  if (roomNumber) query['property.roomNumber'] = roomNumber;
  
  return this.find(query).sort({ 'stayDetails.checkInDate': -1 });
};

TenantTrackingSchema.statics.getOverdueTenants = function(ownerId) {
  const today = new Date();
  return this.find({
    owner: ownerId,
    'stayDetails.isActive': true,
    'analytics.nextDueDate': { $lt: today }
  });
};

// Instance Methods
TenantTrackingSchema.methods.checkOut = function(checkOutReason, notes = '', checkOutBy) {
  this.stayDetails.actualCheckOutDate = new Date();
  this.stayDetails.checkOutTime = new Date().toLocaleTimeString();
  this.stayDetails.checkOutReason = checkOutReason;
  this.stayDetails.checkOutNotes = notes;
  this.stayDetails.checkOutBy = checkOutBy;
  this.stayDetails.isActive = false;
  this.stayDetails.totalStayDays = Math.floor((this.stayDetails.actualCheckOutDate - this.stayDetails.checkInDate) / (24 * 60 * 60 * 1000));
  this.status = 'vacated';
  
  return this.save();
};

TenantTrackingSchema.methods.addPayment = function(amount, type, method, transactionId = '', notes = '', receivedBy) {
  this.financials.payments.push({
    date: new Date(),
    amount,
    type,
    method,
    transactionId,
    notes,
    receivedBy
  });
  
  // Update dues
  if (type === 'rent') {
    this.financials.currentDues.rent = Math.max(0, this.financials.currentDues.rent - amount);
  } else if (type === 'electricity') {
    this.financials.currentDues.electricity = Math.max(0, this.financials.currentDues.electricity - amount);
  }
  
  this.financials.currentDues.total = this.financials.currentDues.rent + this.financials.currentDues.electricity + this.financials.currentDues.other;
  this.analytics.lastPaymentDate = new Date();
  
  return this.save();
};

TenantTrackingSchema.methods.addMaintenanceRequest = function(type, description, priority = 'medium') {
  const requestId = `MNT${Date.now()}${Math.floor(Math.random() * 1000)}`;
  
  this.maintenanceRequests.push({
    requestId,
    type,
    description,
    priority,
    status: 'pending'
  });
  
  this.analytics.maintenanceRequests += 1;
  return this.save();
};

TenantTrackingSchema.methods.updateAnalytics = function() {
  // Calculate total revenue
  this.analytics.totalRevenue = this.financials.payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Calculate average monthly revenue
  const stayMonths = Math.max(1, Math.ceil(this.currentStayDuration / 30));
  this.analytics.averageMonthlyRevenue = this.analytics.totalRevenue / stayMonths;
  
  // Update next due date (typically rent due date)
  const lastPaymentDate = this.analytics.lastPaymentDate || this.stayDetails.checkInDate;
  const nextDue = new Date(lastPaymentDate);
  nextDue.setMonth(nextDue.getMonth() + 1);
  this.analytics.nextDueDate = nextDue;
  
  return this.save();
};

// Pre-save middleware
TenantTrackingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.lastActivityDate = new Date();
  
  // Auto-generate tenant ID if not exists
  if (!this.tenantId) {
    this.tenantId = `TNT${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  
  next();
});

export default mongoose.model('TenantTracking', TenantTrackingSchema);
