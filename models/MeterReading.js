import mongoose from 'mongoose';

const MeterReadingSchema = new mongoose.Schema({
  // Basic Info
  roomId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Room', 
    required: true 
  },
  pgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PG',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Meter Details
  reading: { 
    type: Number, 
    required: true,
    min: 0
  },
  previousReading: {
    type: Number,
    default: 0
  },
  consumption: {
    type: Number,
    default: 0
  },
  
  // Event Details
  date: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  action: { 
    type: String, 
    enum: ['tenant_joined', 'tenant_left', 'monthly_reading', 'manual_reading'], 
    required: true 
  },
  
  // Tenant Info (if action involves tenant)
  tenantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PGResident',
    required: function() {
      return ['tenant_joined', 'tenant_left'].includes(this.action);
    }
  },
  tenantName: { type: String },
  bedNumber: { type: String },
  
  // Active Tenants at time of reading
  activeTenantsCount: { 
    type: Number, 
    required: true,
    min: 0
  },
  activeTenants: [{
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'PGResident' },
    tenantName: { type: String },
    joinDate: { type: Date },
    bedNumber: { type: String }
  }],
  
  // Additional Info
  notes: { type: String },
  meterPhoto: { type: String }, // Photo URL
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Billing Period
  billingMonth: { type: String }, // "2025-03"
  isIncludedInBill: { type: Boolean, default: false },
  
  // Meta Data
  verified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
MeterReadingSchema.index({ roomId: 1, date: -1 });
MeterReadingSchema.index({ pgId: 1, owner: 1 });
MeterReadingSchema.index({ billingMonth: 1, roomId: 1 });
MeterReadingSchema.index({ action: 1, date: -1 });

// Virtual for consumption calculation
MeterReadingSchema.virtual('calculatedConsumption').get(function() {
  return this.reading - (this.previousReading || 0);
});

// Methods
MeterReadingSchema.methods.calculateConsumption = function() {
  this.consumption = this.reading - (this.previousReading || 0);
  return this.consumption;
};

// Static methods
MeterReadingSchema.statics.getLatestReading = function(roomId) {
  return this.findOne({ roomId }).sort({ date: -1 });
};

MeterReadingSchema.statics.getReadingsForBilling = function(roomId, startDate, endDate) {
  return this.find({
    roomId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

export default mongoose.model('MeterReading', MeterReadingSchema);
