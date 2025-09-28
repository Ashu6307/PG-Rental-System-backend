import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Category & Priority
  category: {
    type: String,
    enum: [
      'electrical', 'plumbing', 'carpentry', 'painting', 'hvac', 
      'appliance', 'cleaning', 'pest-control', 'security', 'network',
      'civil-work', 'garden', 'other'
    ],
    required: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Location
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
  location: {
    type: String,
    enum: ['room', 'common-area', 'kitchen', 'bathroom', 'terrace', 'entrance', 'parking', 'garden', 'other'],
    required: true
  },
  specificLocation: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  // Requester Information
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PGResident'
  },
  requestedByType: {
    type: String,
    enum: ['resident', 'owner', 'staff', 'admin'],
    required: true
  },
  contactPerson: {
    name: String,
    phone: String,
    email: String
  },
  
  // Status & Timeline
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'assigned', 'in-progress', 'on-hold', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  acknowledgedAt: Date,
  assignedAt: Date,
  startedAt: Date,
  completedAt: Date,
  expectedCompletionDate: Date,
  
  // Assignment
  assignedTo: {
    vendorType: {
      type: String,
      enum: ['internal-staff', 'external-vendor', 'contractor', 'company']
    },
    vendorId: String,
    vendorName: String,
    vendorPhone: String,
    vendorEmail: String,
    contractorName: String,
    contractorPhone: String,
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Owner'
    }
  },
  
  // Cost & Payment
  estimatedCost: {
    type: Number,
    min: 0
  },
  actualCost: {
    type: Number,
    min: 0
  },
  costBreakdown: [{
    item: String,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number,
    category: {
      type: String,
      enum: ['material', 'labor', 'equipment', 'transportation', 'other']
    }
  }],
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'bank-transfer', 'cheque', 'online']
  },
  
  // Documentation
  images: {
    before: [String], // file paths
    during: [String],
    after: [String]
  },
  documents: [{
    fileName: String,
    filePath: String,
    fileType: String,
    uploadDate: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' }
  }],
  
  // Updates & Communication
  updates: [{
    message: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'updates.addedByModel'
    },
    addedByModel: {
      type: String,
      enum: ['Owner', 'PGResident', 'User']
    },
    timestamp: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: ['status-update', 'comment', 'cost-update', 'schedule-update', 'completion-note'],
      default: 'comment'
    },
    isPublic: { type: Boolean, default: true }
  }],
  
  // Quality & Feedback
  qualityRating: {
    rating: { type: Number, min: 1, max: 5 },
    feedback: String,
    ratedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'PGResident' },
    ratedAt: Date
  },
  
  // Warranty Information
  warranty: {
    hasWarranty: { type: Boolean, default: false },
    warrantyPeriod: Number, // in months
    warrantyStartDate: Date,
    warrantyEndDate: Date,
    warrantyTerms: String,
    warrantyProvider: String
  },
  
  // Recurrence (for scheduled maintenance)
  isRecurring: { type: Boolean, default: false },
  recurringSchedule: {
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'half-yearly', 'yearly']
    },
    nextDueDate: Date,
    lastCompletedDate: Date,
    isActive: { type: Boolean, default: true }
  },
  
  // Emergency & Safety
  isEmergency: { type: Boolean, default: false },
  safetyImpact: {
    type: String,
    enum: ['none', 'low', 'medium', 'high', 'critical'],
    default: 'none'
  },
  temporaryFix: {
    applied: { type: Boolean, default: false },
    description: String,
    appliedBy: String,
    appliedDate: Date
  },
  
  // Approval Workflow (for high-cost items)
  requiresApproval: { type: Boolean, default: false },
  approvalStatus: {
    type: String,
    enum: ['not-required', 'pending', 'approved', 'rejected'],
    default: 'not-required'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner'
  },
  approvedAt: Date,
  rejectionReason: String,
  
  // System Fields
  tenantId: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel'
  },
  createdByModel: {
    type: String,
    enum: ['Owner', 'PGResident', 'User']
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner'
  },
  isActive: { type: Boolean, default: true },
  
  // Analytics Fields
  responseTime: Number, // in hours
  resolutionTime: Number, // in hours
  customerSatisfaction: Number // 1-5 scale
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
maintenanceSchema.index({ owner: 1, status: 1 });
maintenanceSchema.index({ pg: 1, status: 1 });
maintenanceSchema.index({ room: 1 });
maintenanceSchema.index({ requestedBy: 1 });
maintenanceSchema.index({ category: 1, priority: 1 });
maintenanceSchema.index({ status: 1, createdAt: -1 });
maintenanceSchema.index({ assignedTo: 1, status: 1 });
maintenanceSchema.index({ isEmergency: 1, priority: 1 });

// Virtual for total cost
maintenanceSchema.virtual('totalCost').get(function() {
  return this.actualCost || this.estimatedCost || 0;
});

// Virtual for days since creation
maintenanceSchema.virtual('daysSinceCreated').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for status duration
maintenanceSchema.virtual('statusDuration').get(function() {
  const statusDate = this.acknowledgedAt || this.createdAt;
  return Math.floor((new Date() - statusDate) / (1000 * 60 * 60 * 24));
});

// Instance methods
maintenanceSchema.methods.addUpdate = function(message, addedBy, type = 'comment', isPublic = true) {
  this.updates.push({
    message,
    addedBy,
    type,
    isPublic
  });
  return this.save();
};

maintenanceSchema.methods.updateStatus = function(newStatus, updatedBy) {
  const oldStatus = this.status;
  this.status = newStatus;
  this.lastUpdatedBy = updatedBy;
  
  // Set specific timestamps based on status
  const now = new Date();
  switch (newStatus) {
    case 'acknowledged':
      this.acknowledgedAt = now;
      break;
    case 'assigned':
      this.assignedAt = now;
      break;
    case 'in-progress':
      this.startedAt = now;
      break;
    case 'completed':
      this.completedAt = now;
      break;
  }
  
  // Add status update
  this.updates.push({
    message: `Status changed from ${oldStatus} to ${newStatus}`,
    addedBy: updatedBy,
    type: 'status-update',
    timestamp: now
  });
  
  return this.save();
};

maintenanceSchema.methods.calculateResponseTime = function() {
  if (!this.acknowledgedAt) return null;
  return Math.floor((this.acknowledgedAt - this.createdAt) / (1000 * 60 * 60)); // in hours
};

maintenanceSchema.methods.calculateResolutionTime = function() {
  if (!this.completedAt) return null;
  return Math.floor((this.completedAt - this.createdAt) / (1000 * 60 * 60)); // in hours
};

// Static methods
maintenanceSchema.statics.getOverdueRequests = function(ownerId) {
  const overdueDate = new Date();
  overdueDate.setDate(overdueDate.getDate() - 7); // 7 days old
  
  return this.find({
    owner: ownerId,
    status: { $in: ['pending', 'acknowledged', 'assigned', 'in-progress'] },
    createdAt: { $lt: overdueDate }
  });
};

maintenanceSchema.statics.getStatsByCategory = function(ownerId, startDate, endDate) {
  const matchCondition = { owner: mongoose.Types.ObjectId(ownerId) };
  
  if (startDate && endDate) {
    matchCondition.createdAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: matchCondition },
    { $group: {
      _id: '$category',
      count: { $sum: 1 },
      totalCost: { $sum: '$actualCost' },
      avgCost: { $avg: '$actualCost' },
      completedCount: {
        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
      }
    }}
  ]);
};

// Pre-save middleware
maintenanceSchema.pre('save', function(next) {
  // Calculate response and resolution times
  if (this.acknowledgedAt && !this.responseTime) {
    this.responseTime = this.calculateResponseTime();
  }
  
  if (this.completedAt && !this.resolutionTime) {
    this.resolutionTime = this.calculateResolutionTime();
  }
  
  // Set approval requirement for high-cost items
  if (this.estimatedCost > 5000 && !this.requiresApproval) {
    this.requiresApproval = true;
    this.approvalStatus = 'pending';
  }
  
  next();
});

const Maintenance = mongoose.model('Maintenance', maintenanceSchema);
export default Maintenance;
