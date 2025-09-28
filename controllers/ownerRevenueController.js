import Booking from '../models/Booking.js';
import PG from '../models/PG.js';

// Get revenue breakdown for owner's PGs (industry-level)
export const getOwnerRevenue = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const pgs = await PG.find({ owner: ownerId }, '_id name rooms availableRooms');
    const pgIds = pgs.map(pg => pg._id);

    // Get bookings for PGs
    const pgBookings = await Booking.find({ item_type: 'PG', item_id: { $in: pgIds }, status: { $in: ['confirmed', 'completed'] } });

    // Calculate revenue
    const pgRevenue = pgBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalRevenue = pgRevenue;

    // Monthly breakdown
    const monthly = {};
    pgBookings.forEach(b => {
      const month = new Date(b.from_date).toLocaleString('default', { month: 'short', year: 'numeric' });
      monthly[month] = (monthly[month] || 0) + (b.amount || 0);
    });

    // Top earning PG
    const pgEarnings = {};
    pgBookings.forEach(b => {
      pgEarnings[b.item_id] = (pgEarnings[b.item_id] || 0) + (b.amount || 0);
    });
    const topPG = Object.entries(pgEarnings).sort((a, b) => b[1] - a[1])[0];
    const topPGObj = topPG ? pgs.find(pg => pg._id.equals(topPG[0])) : null;

    // Occupancy rate (PG)
    const occupancyRates = pgs.map(pg => {
      const totalRooms = pg.rooms || 0;
      const bookedRooms = pg.availableRooms ? totalRooms - pg.availableRooms : 0;
      return {
        pgId: pg._id,
        name: pg.name,
        occupancy: totalRooms ? Math.round((bookedRooms / totalRooms) * 100) : 0
      };
    });

    // Payment method breakdown (if available)
    // For demo, assume Booking has paymentMethod field
    const paymentBreakdown = {};
    pgBookings.forEach(b => {
      const method = b.paymentMethod || 'Unknown';
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + (b.amount || 0);
    });

    // Trend data (last 6 months)
    const now = new Date();
    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      trend.push({
        month: key,
        revenue: monthly[key] || 0
      });
    }

    res.json({
      totalRevenue,
      pgRevenue,
      monthlyBreakdown: monthly,
      topPG: topPGObj ? { name: topPGObj.name, revenue: topPG[1] } : null,
      occupancyRates,
      paymentBreakdown,
      trend
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
