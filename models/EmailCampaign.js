import mongoose from 'mongoose';

const EmailCampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['newsletter', 'promotional_offer', 'seasonal_campaign', 'customer_retention'],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'],
    default: 'draft'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'active', 'inactive', 'new', 'subscribers_only'],
    default: 'all'
  },
  targetLocation: {
    type: String // Optional city filter
  },
  content: {
    // Store the template data
    templateData: mongoose.Schema.Types.Mixed
  },
  scheduledAt: {
    type: Date
  },
  sentAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stats: {
    totalRecipients: { type: Number, default: 0 },
    emailsSent: { type: Number, default: 0 },
    emailsFailed: { type: Number, default: 0 },
    emailsDelivered: { type: Number, default: 0 },
    emailsOpened: { type: Number, default: 0 },
    emailsClicked: { type: Number, default: 0 },
    unsubscribed: { type: Number, default: 0 }
  },
  estimatedCost: {
    type: Number,
    default: 0
  },
  actualCost: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
EmailCampaignSchema.index({ type: 1, createdAt: -1 });
EmailCampaignSchema.index({ status: 1, scheduledAt: 1 });
EmailCampaignSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model('EmailCampaign', EmailCampaignSchema);
