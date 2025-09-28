import mongoose from 'mongoose';

const ElectricityBillSchema = new mongoose.Schema({
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
  
  // Bill Period
  billMonth: { 
    type: String, 
    required: true // "2025-03"
  },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  
  // Consumption Details
  totalConsumption: { 
    type: Number, 
    required: true,
    min: 0
  },
  totalAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  ratePerUnit: {
    type: Number,
    default: 6.5 // ₹6.5 per unit (configurable)
  },
  
  // Period-wise Breakdown
  periods: [{
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startReading: { type: Number, required: true },
    endReading: { type: Number, required: true },
    consumption: { type: Number, required: true },
    days: { type: Number, required: true },
    activeTenants: [{
      tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'PGResident' },
      tenantName: { type: String },
      bedNumber: { type: String }
    }],
    tenantsCount: { type: Number, required: true },
    costPerTenant: { type: Number, required: true }
  }],
  
  // Individual Tenant Bills
  tenantBills: [{
    tenantId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'PGResident',
      required: true
    },
    tenantName: { type: String, required: true },
    bedNumber: { type: String },
    joinDate: { type: Date },
    
    // Consumption Details
    totalUnits: { type: Number, required: true },
    amount: { type: Number, required: true },
    
    // Period-wise breakdown for this tenant
    periodBreakdown: [{
      period: { type: String }, // "Period 1: 1-7 Jan"
      days: { type: Number },
      units: { type: Number },
      sharedWith: { type: Number }, // number of people
      cost: { type: Number }
    }],
    
    // Payment Status
    paid: { type: Boolean, default: false },
    paidDate: { type: Date },
    paymentMethod: { 
      type: String, 
      enum: ['cash', 'online', 'cheque', 'card'] 
    },
    paymentReference: { type: String },
    
    // Communication
    billSent: { type: Boolean, default: false },
    billSentDate: { type: Date },
    remindersSent: { type: Number, default: 0 },
    lastReminderDate: { type: Date },
    
    // Notes
    notes: { type: String }
  }],
  
  // Bill Status
  status: {
    type: String,
    enum: ['draft', 'generated', 'sent', 'partially_paid', 'fully_paid'],
    default: 'draft'
  },
  
  // Generation Details
  generatedDate: { type: Date, default: Date.now },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Additional Charges
  additionalCharges: [{
    description: { type: String },
    amount: { type: Number },
    applicableTo: { 
      type: String, 
      enum: ['all', 'specific'],
      default: 'all'
    },
    tenantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PGResident' }]
  }],
  
  // Discounts
  discounts: [{
    description: { type: String },
    amount: { type: Number },
    applicableTo: { 
      type: String, 
      enum: ['all', 'specific'],
      default: 'all'
    },
    tenantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PGResident' }]
  }],
  
  // Summary
  summary: {
    totalTenants: { type: Number },
    paidTenants: { type: Number },
    pendingTenants: { type: Number },
    totalPaidAmount: { type: Number, default: 0 },
    totalPendingAmount: { type: Number, default: 0 },
    collectionPercentage: { type: Number, default: 0 }
  },
  
  // Meta
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
ElectricityBillSchema.index({ roomId: 1, billMonth: 1 });
ElectricityBillSchema.index({ pgId: 1, owner: 1 });
ElectricityBillSchema.index({ billMonth: 1, owner: 1 });
ElectricityBillSchema.index({ status: 1, owner: 1 });

// Virtual for collection rate
ElectricityBillSchema.virtual('collectionRate').get(function() {
  if (this.totalAmount === 0) return 0;
  return ((this.summary.totalPaidAmount / this.totalAmount) * 100).toFixed(2);
});

// Methods
ElectricityBillSchema.methods.updateSummary = function() {
  const paidBills = this.tenantBills.filter(bill => bill.paid);
  const pendingBills = this.tenantBills.filter(bill => !bill.paid);
  
  this.summary.totalTenants = this.tenantBills.length;
  this.summary.paidTenants = paidBills.length;
  this.summary.pendingTenants = pendingBills.length;
  this.summary.totalPaidAmount = paidBills.reduce((sum, bill) => sum + bill.amount, 0);
  this.summary.totalPendingAmount = pendingBills.reduce((sum, bill) => sum + bill.amount, 0);
  this.summary.collectionPercentage = this.totalAmount > 0 ? 
    ((this.summary.totalPaidAmount / this.totalAmount) * 100) : 0;
  
  // Update status
  if (this.summary.paidTenants === 0) {
    this.status = 'sent';
  } else if (this.summary.paidTenants === this.summary.totalTenants) {
    this.status = 'fully_paid';
  } else {
    this.status = 'partially_paid';
  }
};

ElectricityBillSchema.methods.markTenantPaid = function(tenantId, paymentDetails = {}) {
  const tenantBill = this.tenantBills.find(bill => 
    bill.tenantId.toString() === tenantId.toString()
  );
  
  if (tenantBill) {
    tenantBill.paid = true;
    tenantBill.paidDate = paymentDetails.paidDate || new Date();
    tenantBill.paymentMethod = paymentDetails.paymentMethod || 'cash';
    tenantBill.paymentReference = paymentDetails.paymentReference;
    
    this.updateSummary();
    return true;
  }
  return false;
};

// Static methods
ElectricityBillSchema.statics.getMonthlyBills = function(owner, month) {
  return this.find({ owner, billMonth: month, isDeleted: false });
};

ElectricityBillSchema.statics.getPendingBills = function(owner) {
  return this.find({ 
    owner, 
    status: { $in: ['sent', 'partially_paid'] },
    isDeleted: false 
  });
};

export default mongoose.model('ElectricityBill', ElectricityBillSchema);
