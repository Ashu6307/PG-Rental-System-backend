const mongoose = require('mongoose');

const auditWebhookSchema = new mongoose.Schema({
  event: { type: String, required: true },
  payload: { type: Object },
  status: { type: String, enum: ['success', 'failed'], default: 'success' },
  response: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditWebhook', auditWebhookSchema);
