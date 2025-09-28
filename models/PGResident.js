import mongoose from 'mongoose';

const pgResidentSchema = new mongoose.Schema({
  // Personal Information
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  email: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true
  },
  phone: { 
    type: String, 
    required: true,
    trim: true
  },
  alternatePhone: { 
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  
  // Address Information
  permanentAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' }
  },
  
  // Emergency Contact
  emergencyContact: {
    name: { type: String, required: true },
    relationship: String,
    phone: { type: String, required: true },
    email: String
  },
  
  // Professional Information
  occupation: {
    type: String,
    enum: ['Student', 'Working Professional', 'Business', 'Other'],
    required: true
  },
  company: String,
  designation: String,
  workAddress: String,
  monthlyIncome: Number,
  
  // PG Details
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Owner', 
    required: true 
  },
  pg: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PG', 
    required: true 
  },
  room: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Room', 
    required: true 
  },
  
  // Tenancy Information
  checkinDate: { 
    type: Date, 
    required: true 
  },
  checkoutDate: Date,
  rentAmount: { 
    type: Number, 
    required: true 
  },
  securityDeposit: { 
    type: Number, 
    required: true 
  },
  agreementDuration: { 
    type: Number, 
    required: true, // in months
    min: 1
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'checkout', 'terminated', 'notice-period'],
    default: 'active'
  },
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['aadhaar', 'pan', 'passport', 'driving-license', 'photo', 'salary-slip', 'bank-statement', 'agreement', 'other'],
      required: true
    },
    documentNumber: String,
    fileName: String,
    filePath: String,
    uploadDate: { type: Date, default: Date.now },
    expiryDate: Date,
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' },
    verifiedAt: Date
  }],
  
  // Payment Information
  paymentDetails: {
    preferredMethod: {
      type: String,
      enum: ['cash', 'upi', 'bank-transfer', 'cheque', 'online'],
      default: 'upi'
    },
    upiId: String,
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      accountHolderName: String
    }
  },

  // Billing Automation Fields
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  lastBillingDate: {
    type: Date,
    default: null
  },
  nextBillingDate: {
    type: Date,
    default: function() {
      if (this.checkinDate) {
        const nextBilling = new Date(this.checkinDate);
        nextBilling.setMonth(nextBilling.getMonth() + 1);
        return nextBilling;
      }
      return null;
    }
  },
  billingDay: {
    type: Number,
    min: 1,
    max: 31,
    default: function() {
      return this.checkinDate ? this.checkinDate.getDate() : 1;
    }
  },
  billingHistory: [{
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    amount: { type: Number, required: true },
    billingDate: { type: Date, required: true },
    dueDate: Date,
    paidDate: Date,
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'cancelled'],
      default: 'pending'
    },
    type: {
      type: String,
      enum: ['rent', 'electricity', 'common_charges', 'security_deposit', 'other'],
      required: true
    },
    notes: String,
    createdAt: { type: Date, default: Date.now }
  }],
  billingPreferences: {
    autoGenerate: { type: Boolean, default: true },
    reminderDays: { type: Number, default: 3 }, // Days before billing to send reminder
    gracePeriod: { type: Number, default: 5 }, // Days after due date before marking overdue
    emailReminders: { type: Boolean, default: true },
    smsReminders: { type: Boolean, default: true },
    whatsappReminders: { type: Boolean, default: false }
  },
  proration: {
    enableProration: { type: Boolean, default: true },
    prorationType: {
      type: String,
      enum: ['daily', 'weekly'],
      default: 'daily'
    }
  },
  
  // Preferences & Settings
  preferences: {
    foodPreference: {
      type: String,
      enum: ['Vegetarian', 'Non-Vegetarian', 'Jain', 'Vegan'],
      default: 'Vegetarian'
    },
    smokingAllowed: { type: Boolean, default: false },
    drinkingAllowed: { type: Boolean, default: false },
    petsAllowed: { type: Boolean, default: false },
    guestPolicy: {
      type: String,
      enum: ['strict', 'moderate', 'flexible'],
      default: 'moderate'
    },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: true }
    }
  },
  
  // Maintenance & Utilities
  maintenanceHistory: [{
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Maintenance' },
    date: Date,
    issue: String,
    status: String
  }],
  
  // Payment History Reference
  paymentHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }],
  
  // Reviews & Ratings
  ratingsGiven: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  
  // Behavior & Notes
  ownerNotes: [{
    note: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' },
    createdAt: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: ['general', 'warning', 'appreciation', 'complaint'],
      default: 'general'
    }
  }],
  
  // Compliance
  backgroundVerified: { type: Boolean, default: false },
  policeVerification: {
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'verified', 'rejected'],
      default: 'pending'
    },
    applicationDate: Date,
    verificationDate: Date,
    certificateNumber: String,
    validUntil: Date
  },
  
  // System Fields
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' },
  isActive: { type: Boolean, default: true },
  
  // Multi-tenancy
  tenantId: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
pgResidentSchema.index({ owner: 1, status: 1 });
pgResidentSchema.index({ pg: 1, status: 1 });
pgResidentSchema.index({ room: 1 });
pgResidentSchema.index({ email: 1 });
pgResidentSchema.index({ phone: 1 });
pgResidentSchema.index({ checkinDate: 1 });
pgResidentSchema.index({ status: 1, checkinDate: -1 });
pgResidentSchema.index({ nextBillingDate: 1, status: 1 });
pgResidentSchema.index({ lastBillingDate: 1 });
pgResidentSchema.index({ billingDay: 1, status: 1 });

// Virtual for full name (if needed for different formats)
pgResidentSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for tenancy duration
pgResidentSchema.virtual('tenancyDuration').get(function() {
  if (!this.checkinDate) return 0;
  const endDate = this.checkoutDate || new Date();
  const diffTime = Math.abs(endDate - this.checkinDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 30); // in months
});

// Virtual for current age
pgResidentSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Virtual for billing status
pgResidentSchema.virtual('billingStatus').get(function() {
  if (!this.nextBillingDate) return 'not_set';
  const today = new Date();
  const daysUntilBilling = Math.ceil((this.nextBillingDate - today) / (1000 * 60 * 60 * 24));
  
  if (daysUntilBilling < 0) return 'overdue';
  if (daysUntilBilling <= 3) return 'due_soon';
  return 'current';
});

// Virtual for outstanding amount
pgResidentSchema.virtual('outstandingAmount').get(function() {
  if (!this.billingHistory || this.billingHistory.length === 0) return 0;
  return this.billingHistory
    .filter(bill => bill.status === 'pending' || bill.status === 'overdue')
    .reduce((total, bill) => total + bill.amount, 0);
});

// Instance methods
pgResidentSchema.methods.calculateTotalStay = function() {
  if (!this.checkinDate) return 0;
  const endDate = this.checkoutDate || new Date();
  return Math.floor((endDate - this.checkinDate) / (1000 * 60 * 60 * 24));
};

pgResidentSchema.methods.isDocumentExpiring = function(days = 30) {
  const expiringDocs = this.documents.filter(doc => {
    if (!doc.expiryDate) return false;
    const daysUntilExpiry = Math.floor((doc.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= days && daysUntilExpiry >= 0;
  });
  return expiringDocs;
};

// Billing-related methods
pgResidentSchema.methods.updateNextBillingDate = function() {
  if (!this.checkinDate) return null;
  
  const currentNext = this.nextBillingDate || new Date(this.checkinDate);
  const newNext = new Date(currentNext);
  
  if (this.billingCycle === 'monthly') {
    newNext.setMonth(newNext.getMonth() + 1);
  } else if (this.billingCycle === 'quarterly') {
    newNext.setMonth(newNext.getMonth() + 3);
  } else if (this.billingCycle === 'yearly') {
    newNext.setFullYear(newNext.getFullYear() + 1);
  }
  
  this.nextBillingDate = newNext;
  return newNext;
};

pgResidentSchema.methods.calculateProratedAmount = function(startDate, endDate) {
  if (!startDate || !endDate || !this.rentAmount) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysInPeriod = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  if (this.proration.prorationType === 'daily') {
    const dailyRate = this.rentAmount / 30; // Assuming 30 days per month
    return Math.round(dailyRate * daysInPeriod);
  } else {
    const weeklyRate = this.rentAmount / 4; // Assuming 4 weeks per month
    const weeks = Math.ceil(daysInPeriod / 7);
    return Math.round(weeklyRate * weeks);
  }
};

pgResidentSchema.methods.isDueBilling = function() {
  if (!this.nextBillingDate) return false;
  const today = new Date();
  return this.nextBillingDate <= today;
};

pgResidentSchema.methods.getDaysUntilBilling = function() {
  if (!this.nextBillingDate) return null;
  const today = new Date();
  return Math.ceil((this.nextBillingDate - today) / (1000 * 60 * 60 * 24));
};

pgResidentSchema.methods.getLastBill = function() {
  if (!this.billingHistory || this.billingHistory.length === 0) return null;
  return this.billingHistory[this.billingHistory.length - 1];
};

pgResidentSchema.methods.addBillingRecord = function(billingData) {
  if (!this.billingHistory) {
    this.billingHistory = [];
  }
  this.billingHistory.push(billingData);
  this.lastBillingDate = billingData.billingDate;
  return this.billingHistory[this.billingHistory.length - 1];
};

// Static methods
pgResidentSchema.statics.findActiveResidents = function(ownerId) {
  return this.find({ owner: ownerId, status: 'active' })
    .populate('pg', 'name')
    .populate('room', 'roomNumber type');
};

pgResidentSchema.statics.getOccupancyStats = function(ownerId) {
  return this.aggregate([
    { $match: { owner: mongoose.Types.ObjectId(ownerId) } },
    { $group: {
      _id: '$status',
      count: { $sum: 1 }
    }}
  ]);
};

// Pre-save middleware
pgResidentSchema.pre('save', function(next) {
  // Auto-set checkout date if status changed to checkout
  if (this.isModified('status') && this.status === 'checkout' && !this.checkoutDate) {
    this.checkoutDate = new Date();
  }
  next();
});

// Pre-remove middleware to clean up references
pgResidentSchema.pre('remove', async function(next) {
  try {
    // Update room status
    await mongoose.model('Room').updateOne(
      { _id: this.room },
      { $unset: { currentResident: "" }, status: 'available' }
    );
    next();
  } catch (err) {
    next(err);
  }
});

const PGResident = mongoose.model('PGResident', pgResidentSchema);
export default PGResident;
