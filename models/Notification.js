import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['email', 'sms', 'push'], required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
  },
  created_at: { type: Date, default: Date.now },
  channel: {
    type: String,
    enum: ['email', 'sms', 'push'],
    required: true,
  },
  meta: { type: mongoose.Schema.Types.Mixed }
});

export default mongoose.model('Notification', NotificationSchema);
