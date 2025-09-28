import mongoose from 'mongoose';

const FeatureContentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Why Choose Our Platform'
  },
  subtitle: {
    type: String,
    default: 'Experience the best in PG accommodations, room rentals, and flat rentals with our comprehensive platform'
  },
  ctaText: {
    type: String,
    default: 'Start Your Journey Today'
  },
  items: [{
    icon: {
      type: String,
      enum: ['home', 'bicycle', 'credit-card', 'star', 'lock', 'mobile', 'building', 'motorcycle'],
      required: true
    },
    color: {
      type: String,
      enum: ['blue', 'purple', 'green', 'orange', 'pink', 'cyan', 'red', 'yellow', 'indigo'],
      default: 'blue'
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better performance
FeatureContentSchema.index({ isActive: 1, isDeleted: 1 });
FeatureContentSchema.index({ 'items.order': 1 });

export default mongoose.model('FeatureContent', FeatureContentSchema);
