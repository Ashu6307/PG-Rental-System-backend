import mongoose from 'mongoose';

const WebhookLogSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  event: { type: String, required: true },
  payload: { type: Object, required: true },
  status: { type: String, enum: ['success', 'failed', 'pending'], default: 'pending' },
  response: { type: Object },
  error: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const WebhookLog = mongoose.model('WebhookLog', WebhookLogSchema);
export default WebhookLog;
