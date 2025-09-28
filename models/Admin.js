import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'super_admin', 'city_admin'], default: 'city_admin' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  
  // City-wise Admin Management
  assignedCities: [{
    city: { type: String, required: true },
    state: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    assignedDate: { type: Date, default: Date.now }
  }],
  
  // Admin Permissions
  permissions: {
    ownerVerification: { type: Boolean, default: true },
    propertyApproval: { type: Boolean, default: true },
    userManagement: { type: Boolean, default: true },
    cityManagement: { type: Boolean, default: false }, // Only for super_admin
    adminManagement: { type: Boolean, default: false } // Only for super_admin
  },
  
  // Contact Information
  phone: { type: String },
  profilePhoto: { type: String },
  
  // System Settings
  settingsVersion: { type: Number, default: 1 },
  settings: { type: Object },
  created_at: { type: Date, default: Date.now },
  
  // Performance Tracking
  stats: {
    ownersVerified: { type: Number, default: 0 },
    propertiesApproved: { type: Number, default: 0 },
    inquiriesHandled: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: Date.now }
  }
}, { timestamps: true });

export default mongoose.model('Admin', AdminSchema);