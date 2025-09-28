import mongoose from 'mongoose';

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  image: {
    type: String,
    required: true
  },
  isNewCity: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  state: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: 200
  },
  
  // Admin Assignment and Management
  assignedAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  adminAssignedDate: {
    type: Date
  },
  
  // City Statistics
  stats: {
    totalOwners: { type: Number, default: 0 },
    verifiedOwners: { type: Number, default: 0 },
    totalProperties: { type: Number, default: 0 },
    activeProperties: { type: Number, default: 0 },
    totalUsers: { type: Number, default: 0 },
    monthlyInquiries: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  
  // City Configuration
  config: {
    autoApproval: { type: Boolean, default: false },
    requireVerification: { type: Boolean, default: true },
    allowNewOwners: { type: Boolean, default: true },
    maxPropertiesPerOwner: { type: Number, default: 10 }
  }
}, {
  timestamps: true
});

// Index for faster queries
citySchema.index({ name: 1, isActive: 1 });

const City = mongoose.model('City', citySchema);

export default City;
