import mongoose from 'mongoose';

const NotificationPreferenceSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  email: { type: Boolean, default: true },
  sms: { type: Boolean, default: false },
  push: { type: Boolean, default: true },
  frequency: { type: String, enum: ['instant', 'daily', 'weekly'], default: 'instant' },
  channels: [{ type: String, enum: ['email', 'sms', 'push'] }],
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const NotificationPreference = mongoose.model('NotificationPreference', NotificationPreferenceSchema);
export default NotificationPreference;
