import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import Favorite from '../models/Favorite.js';
import UserAnalytics from '../models/UserAnalytics.js';
import PG from '../models/PG.js';
import Room from '../models/Room.js';
import Flat from '../models/Flat.js';
import mongoose from 'mongoose';

// Get Dashboard Overview Stats
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get basic stats
    const [
      activeBookings,
      totalBookings,
      totalReviews,
      totalFavorites,
      userAnalytics
    ] = await Promise.all([
      Booking.countDocuments({ user_id: userId, status: { $in: ['confirmed', 'checkedin'] } }),
      Booking.countDocuments({ user_id: userId }),
      Review.countDocuments({ user_id: userId }),
      Favorite.countDocuments({ user_id: userId }),
      UserAnalytics.findOne({ user_id: userId })
    ]);
    
    // Calculate total spent
    const totalSpentResult = await Booking.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId), paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalSpent = totalSpentResult[0]?.total || 0;
    
    // Calculate this month spending
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const thisMonthSpentResult = await Booking.aggregate([
      { 
        $match: { 
          user_id: new mongoose.Types.ObjectId(userId), 
          paymentStatus: 'paid',
          created_at: { $gte: startOfMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const thisMonthSpent = thisMonthSpentResult[0]?.total || 0;
    
    // Calculate percentage change
    const lastMonthSpent = userAnalytics?.lastMonthSpent || 0;
    const spendingChange = lastMonthSpent > 0 ? 
      ((thisMonthSpent - lastMonthSpent) / lastMonthSpent * 100).toFixed(1) : 0;
    
    // Average rating given by user
    const avgRatingResult = await Review.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const averageRating = avgRatingResult[0]?.avgRating || 0;
    
    const stats = {
      activeBookings,
      totalBookings,
      totalSpent,
      thisMonthSpent,
      spendingChange,
      totalFavorites,
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(1))
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Recent Activity
export const getRecentActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recent bookings
    const recentBookings = await Booking.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(5)
      .populate('item_id', 'pg_name name address')
      .lean();
    
    // Get recent reviews
    const recentReviews = await Review.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(3)
      .populate('item_id', 'pg_name name address')
      .lean();
    
    // Get recent favorites
    const recentFavorites = await Favorite.find({ user_id: userId })
      .sort({ _id: -1 })
      .limit(3)
      .populate('item_id', 'pg_name name address')
      .lean();
    
    // Format activity feed
    const activities = [];
    
    // Add bookings to activity
    recentBookings.forEach(booking => {
      activities.push({
        type: 'booking',
        action: `Booking ${booking.status}`,
        property: booking.propertyDetails?.name || booking.item_id?.pg_name || booking.item_id?.name || 'Property',
        location: booking.propertyDetails?.address || booking.item_id?.address || 'Location',
        time: booking.created_at,
        status: booking.status,
        amount: booking.totalAmount
      });
    });
    
    // Add reviews to activity
    recentReviews.forEach(review => {
      activities.push({
        type: 'review',
        action: 'Review submitted',
        property: review.item_id?.pg_name || review.item_id?.name || 'Property',
        location: review.item_id?.address || 'Location',
        time: review.created_at,
        rating: review.rating
      });
    });
    
    // Add favorites to activity
    recentFavorites.forEach(favorite => {
      activities.push({
        type: 'favorite',
        action: 'Property saved',
        property: favorite.item_id?.pg_name || favorite.item_id?.name || 'Property',
        location: favorite.item_id?.address || 'Location',
        time: favorite._id.getTimestamp()
      });
    });
    
    // Sort by time and limit
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const limitedActivities = activities.slice(0, limit);
    
    res.json({ success: true, activities: limitedActivities });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get User Bookings with filters
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    
    // Build query
    const query = { user_id: userId };
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Get bookings with pagination
    const skip = (page - 1) * limit;
    const [bookings, totalCount] = await Promise.all([
      Booking.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('item_id', 'pg_name name address images rating')
        .lean(),
      Booking.countDocuments(query)
    ]);
    
    // Enhance bookings with property details
    const enhancedBookings = bookings.map(booking => ({
      ...booking,
      propertyName: booking.propertyDetails?.name || booking.item_id?.pg_name || booking.item_id?.name,
      propertyAddress: booking.propertyDetails?.address || booking.item_id?.address,
      propertyImages: booking.propertyDetails?.images || booking.item_id?.images || [],
      propertyRating: booking.propertyDetails?.rating || booking.item_id?.rating || 0
    }));
    
    const totalPages = Math.ceil(totalCount / limit);
    
    res.json({
      success: true,
      bookings: enhancedBookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('User bookings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get User Favorites
export const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 12 } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Get favorites with property details
    const favorites = await Favorite.find({ user_id: userId })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Get property details for each favorite
    const enhancedFavorites = await Promise.all(
      favorites.map(async (fav) => {
        let propertyDetails = null;
        
        try {
          if (fav.item_type === 'PG') {
            propertyDetails = await PG.findById(fav.item_id).select('pg_name address images rating rent_per_month city').lean();
          } else if (fav.item_type === 'Room') {
            propertyDetails = await Room.findById(fav.item_id).select('room_number type rent images').lean();
          } else if (fav.item_type === 'Flat') {
            propertyDetails = await Flat.findById(fav.item_id).select('flat_name address images rating rent_per_month').lean();
          }
        } catch (err) {
          console.error('Error fetching property details:', err);
        }
        
        return {
          ...fav,
          propertyDetails: propertyDetails || {
            name: 'Property Not Found',
            address: 'Address Not Available',
            images: [],
            rating: 0,
            price: 0
          }
        };
      })
    );
    
    const totalCount = await Favorite.countDocuments({ user_id: userId });
    const totalPages = Math.ceil(totalCount / limit);
    
    res.json({
      success: true,
      favorites: enhancedFavorites,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('User favorites error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get User Profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('-password_hash').lean();
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Get user analytics
    const analytics = await UserAnalytics.findOne({ user_id: userId }).lean();
    
    // Calculate profile completion
    let completionScore = 0;
    if (user.name) completionScore += 20;
    if (user.email) completionScore += 20;
    if (user.phone) completionScore += 20;
    if (user.profilePhoto) completionScore += 20;
    if (user.emailVerified) completionScore += 20;
    
    const profile = {
      ...user,
      analytics: analytics || {},
      profileCompletionScore: completionScore,
      accountAge: analytics?.accountAge || 0
    };
    
    res.json({ success: true, profile });
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update User Profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, profilePhoto } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (profilePhoto) updateData.profilePhoto = profilePhoto;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password_hash');
    
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get User Analytics
export const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let analytics = await UserAnalytics.findOne({ user_id: userId });
    
    // Create analytics if doesn't exist
    if (!analytics) {
      analytics = new UserAnalytics({ user_id: userId });
      await analytics.save();
    }
    
    // Get monthly booking trends
    const monthlyTrends = await Booking.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: {
            year: { $year: '$created_at' },
            month: { $month: '$created_at' }
          },
          bookings: { $sum: 1 },
          spending: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);
    
    // Get spending by property type
    const spendingByType = await Booking.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId), paymentStatus: 'paid' } },
      {
        $group: {
          _id: '$item_type',
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      analytics: {
        ...analytics.toObject(),
        monthlyTrends,
        spendingByType
      }
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};