// adminAnalyticsController.js
// Industry-level advanced analytics controller for Admin Dashboard
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Owner = require('../models/Owner');
const PG = require('../models/PG');
const Bike = require('../models/Bike');

// Get analytics dashboard data
exports.getAnalytics = async (req, res) => {
  try {
    // Example: bookings, revenue, user growth, owner stats, asset stats
    const totalBookings = await Booking.countDocuments();
    const totalRevenue = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const userGrowth = await User.aggregate([
      { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } }
    ]);
    const ownerStats = await Owner.countDocuments();
    const pgStats = await PG.countDocuments();
    const bikeStats = await Bike.countDocuments();
    res.json({
      totalBookings,
      totalRevenue: totalRevenue[0] ? totalRevenue[0].total : 0,
      userGrowth,
      ownerStats,
      pgStats,
      bikeStats
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};
