// Payment.js
// Model for user payment history

import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' },
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'PGResident' },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  pg: { type: mongoose.Schema.Types.ObjectId, ref: 'PG' },
  
  // Payment Details
  amount: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['rent', 'security-deposit', 'electricity', 'maintenance', 'other'], 
    default: 'rent' 
  },
  method: { type: String, required: true }, // e.g. 'UPI', 'Card', 'Netbanking'
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'upi', 'bank-transfer', 'cheque', 'online', 'card'], 
    default: 'upi' 
  },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' },
  transactionId: { type: String },
  
  // Dates
  dueDate: { type: Date },
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  
  // Additional fields for PG management
  billingPeriod: {
    month: Number,
    year: Number
  },
  description: String,
  isRefunded: { type: Boolean, default: false },
  refundAmount: Number,
  refundDate: Date,
  
  // System fields
  isDeleted: { type: Boolean, default: false },
  tenantId: String
}, { timestamps: true });

// Indexes for better performance
PaymentSchema.index({ user: 1, status: 1 });
PaymentSchema.index({ owner: 1, status: 1 });
PaymentSchema.index({ resident: 1, status: 1 });
PaymentSchema.index({ dueDate: 1, status: 1 });
PaymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model('Payment', PaymentSchema);
export default Payment;
