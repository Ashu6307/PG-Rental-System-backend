import mongoose from 'mongoose';

// User Inquiry System - Admin Mediated Communication
const InquirySchema = new mongoose.Schema({
  // Basic Inquiry Information
  inquiryId: {
    type: String,
    unique: true,
    required: true,
    default: () => `INQ${Date.now()}${Math.floor(Math.random() * 1000)}`
  },
  
  // User Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userContact: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  
  // Property Information
  property: {
    propertyId: { type: mongoose.Schema.Types.ObjectId, required: true },
    propertyType: { type: String, enum: ['PG', 'Room', 'Flat'], required: true },
    propertyName: { type: String, required: true },
    city: { type: String, required: true },
    area: { type: String }
  },
  
  // Owner Information
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Admin Assignment
  assignedAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  adminAssignedDate: {
    type: Date,
    default: Date.now
  },
  
  // Inquiry Details
  inquiryType: {
    type: String,
    enum: ['visit_request', 'price_inquiry', 'availability_check', 'general_inquiry'],
    required: true
  },
  
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Preferred Details
  preferences: {
    moveInDate: { type: Date },
    budgetRange: {
      min: { type: Number },
      max: { type: Number }
    },
    stayDuration: {
      type: String,
      enum: ['short_term', 'long_term', 'temporary']
    },
    roomType: { type: String },
    specialRequirements: { type: String }
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['pending', 'admin_processing', 'owner_contacted', 'response_sent', 'visit_scheduled', 'closed', 'cancelled'],
    default: 'pending'
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Communication History
  communications: [{
    from: {
      type: String,
      enum: ['user', 'admin', 'owner'],
      required: true
    },
    to: {
      type: String,
      enum: ['user', 'admin', 'owner'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    messageType: {
      type: String,
      enum: ['text', 'email', 'call', 'meeting'],
      default: 'text'
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  
  // Admin Actions
  adminActions: [{
    action: {
      type: String,
      enum: ['inquiry_received', 'admin_assigned', 'owner_contacted', 'response_prepared', 'visit_scheduled', 'inquiry_closed'],
      required: true
    },
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    },
    actionDate: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String
    },
    attachments: [{
      type: { type: String },
      url: { type: String },
      name: { type: String }
    }]
  }],
  
  // Visit Scheduling
  visitDetails: {
    isScheduled: { type: Boolean, default: false },
    scheduledDate: { type: Date },
    scheduledTime: { type: String },
    visitType: { type: String, enum: ['physical', 'virtual'] },
    meetingLink: { type: String },
    instructions: { type: String },
    confirmationStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending'
    }
  },
  
  // Response Details
  adminResponse: {
    hasResponse: { type: Boolean, default: false },
    responseMessage: { type: String },
    responseDate: { type: Date },
    attachments: [{
      type: { type: String },
      url: { type: String },
      name: { type: String }
    }],
    followUpRequired: { type: Boolean, default: false },
    followUpDate: { type: Date }
  },
  
  // Outcome Tracking
  outcome: {
    finalStatus: {
      type: String,
      enum: ['booking_initiated', 'not_interested', 'requirements_not_met', 'property_unavailable', 'pending_decision']
    },
    notes: { type: String },
    closedDate: { type: Date },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    satisfaction: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: { type: String }
    }
  },
  
  // System Fields
  source: {
    type: String,
    enum: ['web', 'mobile', 'call', 'walk_in'],
    default: 'web'
  },
  
  ipAddress: { type: String },
  userAgent: { type: String },
  
  // Timestamps
  inquiryDate: {
    type: Date,
    default: Date.now
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // Auto-update lastUpdated on save
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
InquirySchema.index({ inquiryId: 1 });
InquirySchema.index({ user: 1, status: 1 });
InquirySchema.index({ assignedAdmin: 1, status: 1 });
InquirySchema.index({ owner: 1, status: 1 });
InquirySchema.index({ 'property.city': 1, status: 1 });
InquirySchema.index({ status: 1, priority: 1 });
InquirySchema.index({ inquiryDate: -1 });
InquirySchema.index({ lastUpdated: -1 });

// Virtual for response time calculation
InquirySchema.virtual('responseTime').get(function() {
  if (this.adminResponse.responseDate && this.inquiryDate) {
    return Math.floor((this.adminResponse.responseDate - this.inquiryDate) / (1000 * 60 * 60)); // in hours
  }
  return null;
});

// Static Methods
InquirySchema.statics.getPendingInquiries = function(adminId, city = null) {
  const query = { 
    assignedAdmin: adminId, 
    status: { $in: ['pending', 'admin_processing', 'owner_contacted'] }
  };
  if (city) query['property.city'] = city;
  return this.find(query).populate('user owner').sort({ priority: -1, inquiryDate: -1 });
};

InquirySchema.statics.getInquiryStats = function(adminId, timeframe = 'week') {
  const now = new Date();
  let startDate;
  
  switch(timeframe) {
    case 'day':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    default:
      startDate = new Date(now.setDate(now.getDate() - 7));
  }
  
  return this.aggregate([
    {
      $match: {
        assignedAdmin: mongoose.Types.ObjectId(adminId),
        inquiryDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Instance Methods
InquirySchema.methods.addCommunication = function(from, to, message, messageType = 'text') {
  this.communications.push({
    from,
    to,
    message,
    messageType,
    timestamp: new Date()
  });
  this.lastUpdated = new Date();
  return this.save();
};

InquirySchema.methods.updateStatus = function(newStatus, adminId, notes = '') {
  this.status = newStatus;
  this.adminActions.push({
    action: `status_changed_to_${newStatus}`,
    actionBy: adminId,
    notes
  });
  this.lastUpdated = new Date();
  return this.save();
};

InquirySchema.methods.scheduleVisit = function(visitDate, visitTime, visitType = 'physical', instructions = '') {
  this.visitDetails = {
    isScheduled: true,
    scheduledDate: visitDate,
    scheduledTime: visitTime,
    visitType,
    instructions,
    confirmationStatus: 'pending'
  };
  this.status = 'visit_scheduled';
  this.lastUpdated = new Date();
  return this.save();
};

// Pre-save middleware
InquirySchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

export default mongoose.model('Inquiry', InquirySchema);
