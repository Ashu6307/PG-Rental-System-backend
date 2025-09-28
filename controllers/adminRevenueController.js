// adminRevenueController.js
// Controller for admin revenue analytics (industry-level)

const Payment = require('../models/Payment');

exports.getRevenueAnalytics = async (req, res) => {
  try {
    // Example: total revenue, monthly breakdown, top PGs/Bikes
    const payments = await Payment.find({ status: 'success', isDeleted: false });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    // Monthly breakdown
    const monthly = {};
    payments.forEach(p => {
      const month = p.paidAt ? new Date(p.paidAt).toISOString().slice(0,7) : 'Unknown';
      monthly[month] = (monthly[month] || 0) + p.amount;
    });
    res.json({ success: true, analytics: { totalRevenue, monthly } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
