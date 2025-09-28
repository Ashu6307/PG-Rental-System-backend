import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceId: { type: String, unique: true },
  bookingId: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemType: { type: String, enum: ['PG', 'Room', 'Flat'], required: true },
  itemName: { type: String },
  itemAddress: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  amount: { type: Number, required: true },
  gst: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  details: { type: Object },
  header: { type: String },
  footer: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
