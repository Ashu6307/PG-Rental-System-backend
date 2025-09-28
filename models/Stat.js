import mongoose from 'mongoose';

const StatSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g. 'pg', 'room', 'flat', 'user', 'booking'
  count: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
  tenantId: { type: String }, // multi-tenancy support
  isDeleted: { type: Boolean, default: false }, // soft delete
}, { timestamps: true });

export default mongoose.model('Stat', StatSchema);
