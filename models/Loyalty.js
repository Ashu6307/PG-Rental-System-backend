import mongoose from 'mongoose';

const LoyaltySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points: { type: Number, default: 0 },
  rewards: [{
    type: { type: String },
    value: { type: String },
    redeemed: { type: Boolean, default: false },
    redeemedAt: { type: Date }
  }],
  lastUpdated: { type: Date, default: Date.now }
});

const Loyalty = mongoose.model('Loyalty', LoyaltySchema);
export default Loyalty;
