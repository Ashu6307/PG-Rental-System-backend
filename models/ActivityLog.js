import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  // Basic activity info
  action: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['checkin', 'checkout', 'payment', 'maintenance', 'bill', 'document', 'communication', 'other'], 
    required: true 
  },
  description: { type: String, required: true },
  
  // Who performed the action
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByType: { 
    type: String, 
    enum: ['owner', 'resident', 'admin', 'system'], 
    default: 'system' 
  },
  
  // Target of the action
  targetId: { type: mongoose.Schema.Types.ObjectId },
  targetType: { type: String },
  
  // PG Management specific fields
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' },
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'PGResident' },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  pg: { type: mongoose.Schema.Types.ObjectId, ref: 'PG' },
  
  // Additional details
  details: { type: Object },
  metadata: { type: Object },
  
  // Severity and priority
  severity: { 
    type: String, 
    enum: ['low', 'normal', 'high', 'critical'], 
    default: 'normal' 
  },
  
  // System fields
  isPublic: { type: Boolean, default: true }, // visible to residents
  tenantId: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for better performance
activityLogSchema.index({ owner: 1, createdAt: -1 });
activityLogSchema.index({ resident: 1, createdAt: -1 });
activityLogSchema.index({ type: 1, createdAt: -1 });
activityLogSchema.index({ severity: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
