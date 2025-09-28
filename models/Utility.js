import mongoose from 'mongoose';

const utilitySchema = new mongoose.Schema({
  // Basic Information
  type: {
    type: String,
    enum: ['electricity', 'water', 'gas', 'internet', 'cable-tv', 'maintenance-charge', 'cleaning', 'security', 'other'],
    required: true
  },
  subtype: {
    type: String, // e.g., 'common-area-electricity', 'room-electricity', 'backup-generator'
    trim: true
  },
  
  // Location & Ownership
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
    ref: 'Room'
  },
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PGResident'
  },
  
  // Billing Period
  billingPeriod: {
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    startDate: Date,
    endDate: Date
  },
  
  // Meter Readings (for measurable utilities)
  meterReadings: {
    previousReading: {
      value: Number,
      date: Date,
      readBy: String,
      meterPhoto: String
    },
    currentReading: {
      value: Number,
      date: Date,
      readBy: String,
      meterPhoto: String
    },
    meterNumber: String,
    meterType: {
      type: String,
      enum: ['analog', 'digital', 'smart']
    }
  },
  
  // Consumption & Units
  unitsConsumed: {
    type: Number,
    min: 0
  },
  unitType: {
    type: String,
    enum: ['kWh', 'liters', 'cubic-meters', 'GB', 'minutes', 'flat-rate', 'other'],
    default: 'kWh'
  },
  
  // Pricing Structure
  rateStructure: {
    baseRate: Number, // per unit rate
    slabRates: [{
      minUnits: Number,
      maxUnits: Number,
      ratePerUnit: Number
    }],
    fixedCharges: Number,
    governmentTax: Number,
    serviceTax: Number,
    otherCharges: [{
      name: String,
      amount: Number,
      type: {
        type: String,
        enum: ['fixed', 'percentage']
      }
    }]
  },
  
  // Amount Calculation
  baseAmount: Number,
  taxAmount: Number,
  additionalCharges: Number,
  discountAmount: Number,
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Payment Information
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: Date,
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'bank-transfer', 'cheque', 'online', 'adjustment']
  },
  transactionId: String,
  receiptNumber: String,
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'generated', 'sent', 'paid', 'overdue', 'partial', 'disputed', 'cancelled'],
    default: 'generated'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid', 'overpaid', 'refunded'],
    default: 'unpaid'
  },
  
  // Sharing (for shared utilities)
  isShared: {
    type: Boolean,
    default: false
  },
  sharingDetails: {
    totalResidents: Number,
    sharePercentage: Number, // specific resident's share
    sharedWith: [{
      resident: { type: mongoose.Schema.Types.ObjectId, ref: 'PGResident' },
      room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
      sharePercentage: Number,
      shareAmount: Number
    }],
    divisionMethod: {
      type: String,
      enum: ['equal', 'by-consumption', 'by-room-size', 'custom']
    }
  },
  
  // Documents & Bills
  billDocument: {
    originalBill: String, // file path to utility company bill
    generatedBill: String, // file path to generated resident bill
    receiptDocument: String
  },
  
  // Provider Information
  serviceProvider: {
    name: String,
    type: {
      type: String,
      enum: ['government', 'private', 'cooperative']
    },
    accountNumber: String,
    connectionNumber: String,
    contactDetails: {
      phone: String,
      email: String,
      address: String
    }
  },
  
  // Notifications
  notifications: {
    billGenerated: {
      sent: Boolean,
      sentAt: Date,
      method: [String] // email, sms, whatsapp
    },
    dueReminder: {
      sent: Boolean,
      sentAt: Date,
      reminderCount: { type: Number, default: 0 }
    },
    overdueNotice: {
      sent: Boolean,
      sentAt: Date
    }
  },
  
  // Late Fees & Penalties
  lateFees: {
    applicable: { type: Boolean, default: false },
    amount: Number,
    calculatedOn: Date,
    feeStructure: {
      type: String,
      enum: ['fixed', 'percentage', 'daily'],
      default: 'percentage'
    },
    rate: Number // percentage or daily rate
  },
  
  // Adjustments & Corrections
  adjustments: [{
    type: {
      type: String,
      enum: ['credit', 'debit', 'correction']
    },
    amount: Number,
    reason: String,
    appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' },
    appliedDate: { type: Date, default: Date.now },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' }
  }],
  
  // Previous Bills Reference
  previousBill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utility'
  },
  nextBill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utility'
  },
  
  // Disputes & Issues
  disputes: [{
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'PGResident' },
    raisedDate: { type: Date, default: Date.now },
    issue: String,
    status: {
      type: String,
      enum: ['open', 'under-review', 'resolved', 'rejected']
    },
    resolution: String,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' },
    resolvedDate: Date
  }],
  
  // Auto-generation Settings
  autoGenerated: {
    type: Boolean,
    default: false
  },
  autoGenerationRule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutoBillingRule'
  },
  
  // System Fields
  tenantId: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner'
  },
  isActive: { type: Boolean, default: true },
  
  // Notes & Comments
  internalNotes: String,
  publicNotes: String, // visible to resident
  
  // Analytics Fields
  consumptionTrend: {
    comparedToPrevious: Number, // percentage change
    seasonalFactor: Number,
    efficiencyRating: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
utilitySchema.index({ owner: 1, status: 1 });
utilitySchema.index({ pg: 1, type: 1 });
utilitySchema.index({ room: 1, billingPeriod: 1 });
utilitySchema.index({ resident: 1, status: 1 });
utilitySchema.index({ 'billingPeriod.month': 1, 'billingPeriod.year': 1 });
utilitySchema.index({ dueDate: 1, status: 1 });
utilitySchema.index({ type: 1, createdAt: -1 });

// Virtual for days overdue
utilitySchema.virtual('daysOverdue').get(function() {
  if (this.status !== 'overdue' && this.paymentStatus !== 'unpaid') return 0;
  if (!this.dueDate) return 0;
  const today = new Date();
  const diffTime = today - this.dueDate;
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
});

// Virtual for effective amount (including late fees)
utilitySchema.virtual('effectiveAmount').get(function() {
  let amount = this.totalAmount;
  if (this.lateFees && this.lateFees.applicable) {
    amount += this.lateFees.amount || 0;
  }
  if (this.adjustments) {
    this.adjustments.forEach(adj => {
      if (adj.type === 'credit') amount -= adj.amount;
      else if (adj.type === 'debit') amount += adj.amount;
    });
  }
  return Math.max(0, amount);
});

// Virtual for billing period display
utilitySchema.virtual('billingPeriodDisplay').get(function() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[this.billingPeriod.month - 1]} ${this.billingPeriod.year}`;
});

// Instance methods
utilitySchema.methods.calculateUnitsConsumed = function() {
  if (!this.meterReadings?.currentReading?.value || !this.meterReadings?.previousReading?.value) {
    return this.unitsConsumed || 0;
  }
  return this.meterReadings.currentReading.value - this.meterReadings.previousReading.value;
};

utilitySchema.methods.calculateAmount = function() {
  const units = this.calculateUnitsConsumed();
  let baseAmount = 0;
  
  if (this.rateStructure?.slabRates?.length > 0) {
    // Slab-based calculation
    let remainingUnits = units;
    for (const slab of this.rateStructure.slabRates) {
      const slabUnits = Math.min(remainingUnits, slab.maxUnits - slab.minUnits + 1);
      baseAmount += slabUnits * slab.ratePerUnit;
      remainingUnits -= slabUnits;
      if (remainingUnits <= 0) break;
    }
  } else if (this.rateStructure?.baseRate) {
    // Simple rate calculation
    baseAmount = units * this.rateStructure.baseRate;
  }
  
  // Add fixed charges
  baseAmount += this.rateStructure?.fixedCharges || 0;
  
  // Calculate taxes
  const taxAmount = (baseAmount * (this.rateStructure?.governmentTax || 0)) / 100;
  const serviceTax = (baseAmount * (this.rateStructure?.serviceTax || 0)) / 100;
  
  // Additional charges
  let additionalCharges = 0;
  if (this.rateStructure?.otherCharges) {
    additionalCharges = this.rateStructure.otherCharges.reduce((sum, charge) => {
      return sum + (charge.type === 'fixed' ? charge.amount : (baseAmount * charge.amount) / 100);
    }, 0);
  }
  
  this.baseAmount = baseAmount;
  this.taxAmount = taxAmount + serviceTax;
  this.additionalCharges = additionalCharges;
  this.totalAmount = baseAmount + this.taxAmount + additionalCharges - (this.discountAmount || 0);
  
  return this.totalAmount;
};

utilitySchema.methods.applyLateFee = function() {
  if (!this.lateFees?.applicable || this.paymentStatus === 'paid') return;
  
  const daysOverdue = this.daysOverdue;
  if (daysOverdue <= 0) return;
  
  let lateFeeAmount = 0;
  if (this.lateFees.feeStructure === 'fixed') {
    lateFeeAmount = this.lateFees.rate;
  } else if (this.lateFees.feeStructure === 'percentage') {
    lateFeeAmount = (this.totalAmount * this.lateFees.rate) / 100;
  } else if (this.lateFees.feeStructure === 'daily') {
    lateFeeAmount = this.lateFees.rate * daysOverdue;
  }
  
  this.lateFees.amount = lateFeeAmount;
  this.lateFees.calculatedOn = new Date();
  
  return this.save();
};

utilitySchema.methods.markAsPaid = function(paymentDetails = {}) {
  this.paymentStatus = 'paid';
  this.status = 'paid';
  this.paidDate = paymentDetails.paidDate || new Date();
  this.paymentMethod = paymentDetails.method;
  this.transactionId = paymentDetails.transactionId;
  this.receiptNumber = paymentDetails.receiptNumber;
  
  return this.save();
};

// Static methods
utilitySchema.statics.generateMonthlyBills = async function(ownerId, month, year) {
  const residents = await mongoose.model('PGResident').find({
    owner: ownerId,
    status: 'active'
  }).populate('room');
  
  const bills = [];
  for (const resident of residents) {
    // Generate electricity bill
    const electricityBill = new this({
      type: 'electricity',
      owner: ownerId,
      pg: resident.pg,
      room: resident.room._id,
      resident: resident._id,
      billingPeriod: { month, year },
      dueDate: new Date(year, month, 5), // 5th of next month
      // Add meter readings and rate structure as needed
    });
    
    bills.push(electricityBill);
  }
  
  return this.insertMany(bills);
};

utilitySchema.statics.getOverdueBills = function(ownerId) {
  return this.find({
    owner: ownerId,
    dueDate: { $lt: new Date() },
    paymentStatus: { $in: ['unpaid', 'partial'] }
  }).populate('resident', 'name phone').populate('room', 'roomNumber');
};

utilitySchema.statics.getConsumptionStats = function(ownerId, type, startDate, endDate) {
  const matchCondition = { owner: mongoose.Types.ObjectId(ownerId), type };
  
  if (startDate && endDate) {
    matchCondition.createdAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: matchCondition },
    { $group: {
      _id: {
        year: '$billingPeriod.year',
        month: '$billingPeriod.month'
      },
      totalUnits: { $sum: '$unitsConsumed' },
      totalAmount: { $sum: '$totalAmount' },
      billCount: { $sum: 1 },
      avgConsumption: { $avg: '$unitsConsumed' }
    }},
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
};

// Pre-save middleware
utilitySchema.pre('save', function(next) {
  // Auto-calculate units consumed if meter readings are available
  if (this.meterReadings?.currentReading?.value && this.meterReadings?.previousReading?.value) {
    this.unitsConsumed = this.calculateUnitsConsumed();
  }
  
  // Auto-calculate amount if rate structure is available
  if (this.rateStructure && this.unitsConsumed !== undefined) {
    this.calculateAmount();
  }
  
  // Update status based on payment status and due date
  if (this.paymentStatus === 'paid') {
    this.status = 'paid';
  } else if (this.dueDate < new Date() && this.paymentStatus === 'unpaid') {
    this.status = 'overdue';
  }
  
  next();
});

const Utility = mongoose.model('Utility', utilitySchema);
export default Utility;
