import mongoose from 'mongoose';

const VersionedSettingSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  key: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  version: { type: Number, default: 1 },
  history: [
    {
      value: mongoose.Schema.Types.Mixed,
      version: Number,
      updatedAt: Date
    }
  ],
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const VersionedSetting = mongoose.model('VersionedSetting', VersionedSettingSchema);
export default VersionedSetting;
