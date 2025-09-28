import Booking from '../models/Booking.js';
import PG from '../models/PG.js';
import Room from '../models/Room.js';
import PGResident from '../models/PGResident.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Payment = require('../models/Payment.js');
import Maintenance from '../models/Maintenance.js';
import Review from '../models/Review.js';
import Utility from '../models/Utility.js';

// Get comprehensive analytics for PG & Room Rental owner
export const getOwnerAnalytics = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { period = 'monthly', startDate, endDate } = req.query;

    // Date range for analytics
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (period === 'monthly') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      dateFilter.createdAt = { $gte: startOfMonth };
    }

    // PG/Room Property Stats
    const pgProperties = await PG.find({ owner: ownerId }).populate('rooms');
    const totalRooms = await Room.countDocuments({ owner: ownerId });
    const occupiedRooms = await Room.countDocuments({ owner: ownerId, status: 'occupied' });
    const availableRooms = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms * 100).toFixed(1) : 0;

    // Tenant Analytics
    const totalTenants = await PGResident.countDocuments({ owner: ownerId });
    const activeTenants = await PGResident.countDocuments({ owner: ownerId, status: 'active' });
    const newTenantsThisMonth = await PGResident.countDocuments({ 
      owner: ownerId, 
      ...dateFilter,
      status: 'active'
    });

    // Revenue Analytics
    const revenueStats = await Payment.aggregate([
      { $match: { owner: ownerId, ...dateFilter } },
      { $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalPayments: { $sum: 1 },
        avgPayment: { $avg: '$amount' }
      }}
    ]);

    // Monthly Revenue Trend (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyRevenue = await Payment.aggregate([
      { $match: { owner: ownerId, createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Revenue Breakdown by Type
    const revenueBreakdown = await Payment.aggregate([
      { $match: { owner: ownerId, ...dateFilter } },
      { $group: {
        _id: '$type',
        amount: { $sum: '$amount' },
        count: { $sum: 1 }
      }}
    ]);

    // Maintenance Analytics
    const maintenanceStats = await Maintenance.aggregate([
      { $match: { owner: ownerId, ...dateFilter } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalCost: { $sum: '$cost' }
      }}
    ]);

    // Utility Analytics
    const utilityStats = await Utility.aggregate([
      { $match: { owner: ownerId, ...dateFilter } },
      { $group: {
        _id: '$type',
        totalUnits: { $sum: '$unitsConsumed' },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }}
    ]);

    // Review & Satisfaction Analytics
    const reviewStats = await Review.aggregate([
      { $match: { owner: ownerId, ...dateFilter } },
      { $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingsDistribution: {
          $push: '$rating'
        }
      }}
    ]);

    // Booking Analytics (for Room bookings)
    const bookingStats = await Booking.aggregate([
      { $match: { owner: ownerId, ...dateFilter } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }}
    ]);

    // Payment Delay Analytics
    const paymentDelayStats = await Payment.aggregate([
      { $match: { owner: ownerId } },
      { $addFields: {
        isLate: {
          $gt: ['$paidAt', '$dueDate']
        }
      }},
      { $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        latePayments: { $sum: { $cond: ['$isLate', 1, 0] } }
      }}
    ]);

    // Calculate derived metrics
    const paymentDelayRate = paymentDelayStats[0] ? 
      (paymentDelayStats[0].latePayments / paymentDelayStats[0].totalPayments * 100).toFixed(1) : 0;

    // Tenant retention rate
    const totalCheckouts = await PGResident.countDocuments({ owner: ownerId, status: 'checkout' });
    const totalTenanciesEver = await PGResident.countDocuments({ owner: ownerId });
    const retentionRate = totalTenanciesEver > 0 ? 
      ((totalTenanciesEver - totalCheckouts) / totalTenanciesEver * 100).toFixed(1) : 100;

    const averageStayDuration = await PGResident.aggregate([
      { $match: { owner: ownerId, status: { $in: ['active', 'checkout'] } } },
      { $addFields: {
        stayDuration: {
          $divide: [
            { $subtract: [
              { $ifNull: ['$checkoutDate', new Date()] },
              '$checkinDate'
            ]},
            1000 * 60 * 60 * 24 * 30 // Convert to months
          ]
        }
      }},
      { $group: {
        _id: null,
        avgStay: { $avg: '$stayDuration' }
      }}
    ]);

    // Compile response
    const analytics = {
      overview: {
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        monthlyGrowth: 0, // Calculate based on comparison
        occupancyRate: parseFloat(occupancyRate),
        totalProperties: pgProperties.length,
        totalRooms,
        occupiedRooms,
        availableRooms,
        activeTenants,
        totalTenants,
        newTenantsThisMonth,
        averageStayDuration: averageStayDuration[0]?.avgStay || 0,
        tenantRetentionRate: parseFloat(retentionRate),
        paymentDelayRate: parseFloat(paymentDelayRate),
        averageRent: revenueStats[0]?.avgPayment || 0,
        satisfactionScore: reviewStats[0]?.avgRating || 0
      },
      revenue: {
        monthlyTrend: monthlyRevenue,
        breakdown: revenueBreakdown,
        totalPayments: revenueStats[0]?.totalPayments || 0,
        avgPaymentAmount: revenueStats[0]?.avgPayment || 0
      },
      properties: {
        pgProperties: pgProperties.map(pg => ({
          id: pg._id,
          name: pg.name,
          roomCount: pg.rooms?.length || 0,
          occupancyRate: pg.rooms?.length > 0 ? 
            (pg.rooms.filter(r => r.status === 'occupied').length / pg.rooms.length * 100).toFixed(1) : 0
        }))
      },
      maintenance: maintenanceStats,
      utilities: utilityStats,
      reviews: reviewStats[0] || { avgRating: 0, totalReviews: 0 },
      bookings: bookingStats,
      trends: {
        occupancyTrend: [], // TODO: Calculate month-over-month
        revenueTrend: monthlyRevenue,
        tenantTrend: [] // TODO: Calculate month-over-month
      }
    };

    res.json(analytics);
  } catch (err) {
    console.error('Owner Analytics Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get specific period analytics
export const getOwnerAnalyticsByPeriod = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { period, year, month } = req.params;

    let dateFilter = {};
    
    if (period === 'monthly' && year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
    }

    // Similar aggregations with specific date filter
    const analytics = await getAnalyticsForPeriod(ownerId, dateFilter);
    
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper function for period-specific analytics
const getAnalyticsForPeriod = async (ownerId, dateFilter) => {
  const revenue = await Payment.aggregate([
    { $match: { owner: ownerId, ...dateFilter } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } }}
  ]);

  const maintenance = await Maintenance.aggregate([
    { $match: { owner: ownerId, ...dateFilter } },
    { $group: { _id: null, total: { $sum: '$cost' }, count: { $sum: 1 } }}
  ]);

  return {
    revenue: revenue[0] || { total: 0, count: 0 },
    maintenance: maintenance[0] || { total: 0, count: 0 },
    // Add more metrics as needed
  };
};
