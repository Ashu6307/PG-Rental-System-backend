import mongoose from 'mongoose';

const EmailLogSchema = new mongoose.Schema({
  recipient: {
    type: String,
    required: true,
    index: true
  },
  recipientName: {
    type: String
  },
  subject: {
    type: String,
    required: true
  },
  emailType: {
    type: String,
    enum: [
      'welcome',
      'otp',
      'password_reset',
      'password_reset_confirmation',
      'profile_update',
      'booking_request',
      'booking_approved',
      'booking_rejected',
      'booking_completed',
      'payment_receipt',
      'payment_failed',
      'refund_confirmation',
      'newsletter',
      'promotional_offer',
      'seasonal_campaign',
      'customer_retention',
      'login_security_alert'
    ],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked'],
    default: 'sent',
    index: true
  },
  errorMessage: {
    type: String
  },
  sentAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  deliveredAt: {
    type: Date
  },
  openedAt: {
    type: Date
  },
  clickedAt: {
    type: Date
  },
  campaignId: {
    type: String,
    index: true
  },
  campaignName: {
    type: String
  },
  templateUsed: {
    type: String
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    location: String,
    deviceType: String
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin who sent the campaign
  }
}, {
  timestamps: true
});

// Indexes for performance
EmailLogSchema.index({ emailType: 1, sentAt: -1 });
EmailLogSchema.index({ status: 1, sentAt: -1 });
EmailLogSchema.index({ campaignId: 1, status: 1 });
EmailLogSchema.index({ recipient: 1, sentAt: -1 });

export default mongoose.model('EmailLog', EmailLogSchema);
