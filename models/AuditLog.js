import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  target_id: { type: mongoose.Schema.Types.ObjectId },
  target_type: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  webhookEventType: {
    type: String,
    required: false,
  },
  tenantId: {
    type: String,
    required: false,
    index: true,
  },
});

export default mongoose.model('AuditLog', AuditLogSchema);
