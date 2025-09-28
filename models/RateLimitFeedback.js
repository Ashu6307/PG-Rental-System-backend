import mongoose from 'mongoose';

const RateLimitFeedbackSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  endpoint: { type: String, required: true },
  feedback: { type: String, required: true },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const RateLimitFeedback = mongoose.model('RateLimitFeedback', RateLimitFeedbackSchema);
export default RateLimitFeedback;
