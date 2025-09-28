import mongoose from 'mongoose';

const UserAnalyticsSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  
  // Booking Analytics
  totalBookings: { type: Number, default: 0 },
  activeBookings: { type: Number, default: 0 },
  completedBookings: { type: Number, default: 0 },
  cancelledBookings: { type: Number, default: 0 },
  
  // Financial Analytics
  totalSpent: { type: Number, default: 0 },
  thisMonthSpent: { type: Number, default: 0 },
  lastMonthSpent: { type: Number, default: 0 },
  averageBookingValue: { type: Number, default: 0 },
  
  // Property Preferences
  favoriteLocations: [String],
  preferredPropertyTypes: [String],
  averageStayDuration: { type: Number, default: 0 },
  
  // Engagement Analytics
  totalReviews: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalFavorites: { type: Number, default: 0 },
  profileCompletionScore: { type: Number, default: 0 },
  
  // Activity Timeline
  lastBookingDate: { type: Date },
  lastLoginDate: { type: Date },
  accountAge: { type: Number, default: 0 }, // in days
  
  // Monthly Stats (for trend analysis)
  monthlyStats: [{
    month: { type: String }, // Format: "2024-09"
    bookings: { type: Number, default: 0 },
    spending: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 }
  }],
  
  // Performance Metrics
  bookingConversionRate: { type: Number, default: 0 }, // Favorites to Bookings
  repeatBookingRate: { type: Number, default: 0 },
  cancellationRate: { type: Number, default: 0 },
  
  // Behavioral Insights
  peakBookingMonths: [String],
  preferredBookingDays: [String], // weekday patterns
  searchPatterns: [{
    location: String,
    searchCount: { type: Number, default: 0 },
    lastSearched: { type: Date }
  }],
  
  // System Fields
  lastUpdated: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for better performance
UserAnalyticsSchema.index({ user_id: 1 });
UserAnalyticsSchema.index({ lastUpdated: 1 });
UserAnalyticsSchema.index({ 'monthlyStats.month': 1 });

// Update lastUpdated on save
UserAnalyticsSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

export default mongoose.model('UserAnalytics', UserAnalyticsSchema);