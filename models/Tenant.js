import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  domain: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' },
  createdAt: { type: Date, default: Date.now },
  settings: { type: Object }
});

const Tenant = mongoose.model('Tenant', tenantSchema);
export default Tenant;
