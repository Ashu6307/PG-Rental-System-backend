// RateLimitLog.js
// Industry-level rate limit log model
const mongoose = require('mongoose');

const RateLimitLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ip: { type: String },
  endpoint: { type: String },
  method: { type: String },
  status: { type: String, enum: ['blocked', 'allowed'], default: 'allowed' },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RateLimitLog', RateLimitLogSchema);
