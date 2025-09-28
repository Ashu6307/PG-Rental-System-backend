const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  itemType: { type: String, enum: ['PG', 'Room', 'Flat'], required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId },
  price: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  effectiveFrom: { type: Date },
  effectiveTo: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pricing', pricingSchema);
