import mongoose from 'mongoose';

const MarketingStatSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g. 'cities', 'support', 'rating', 'properties'
  value: { type: String, required: true }, // e.g. '10+', '24/7', '4.8★', '500+'
  label: { type: String, required: true }, // e.g. 'Cities Covered', 'Customer Support'
  order: { type: Number, default: 0 }, // for display ordering
  isActive: { type: Boolean, default: true }, // to show/hide specific stats
  tenantId: { type: String }, // multi-tenancy support
  isDeleted: { type: Boolean, default: false }, // soft delete
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

export default mongoose.model('MarketingStat', MarketingStatSchema);
