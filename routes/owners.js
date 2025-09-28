const express = require('express');
const router = express.Router();
const Owner = require('../models/Owner');

// Owner dashboard stats endpoint
router.get('/dashboard', async (req, res) => {
  try {
    // Mock dashboard data for owner
    const dashboardData = {
      stats: {
        totalProperties: 12,
        activeBookings: 8,
        totalRevenue: 45000,
        monthlyGrowth: 15.5,
        pendingPayments: 3,
        averageRating: 4.6
      },
      recentBookings: [
        {
          id: 1,
          propertyName: "Cozy PG Near Metro",
          guestName: "John Doe",
          checkIn: "2025-08-10",
          checkOut: "2025-09-10",
          amount: 8000,
          status: "confirmed"
        },
        {
          id: 2,
          propertyName: "Modern Studio Apartment",
          guestName: "Jane Smith",
          checkIn: "2025-08-15",
          checkOut: "2025-08-20",
          amount: 3500,
          status: "pending"
        }
      ],
      notifications: [
        {
          id: 1,
          message: "New booking request for Modern Studio Apartment",
          type: "booking",
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          read: false
        },
        {
          id: 2,
          message: "Payment received for Cozy PG Near Metro",
          type: "payment",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          read: true
        }
      ]
    };
    
    res.json({ success: true, dashboard: dashboardData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Advanced owner search/filter endpoint
router.post('/search', async (req, res) => {
  const { filters, sort, page, limit } = req.body;
  try {
    // TODO: Implement advanced search/filter logic
    // Example: Use MongoDB aggregation for flexible search
    const owners = await Owner.aggregate([
      { $match: filters || {} },
      { $sort: sort || { createdAt: -1 } },
      { $skip: ((page || 1) - 1) * (limit || 20) },
      { $limit: limit || 20 },
    ]);
    res.status(200).json({ success: true, owners });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Get all owners with account creation and last login info
router.get('/admin/list', async (req, res) => {
  try {
    const owners = await Owner.find({}, 'name email createdAt lastLogin');
    res.status(200).json({ success: true, owners });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get owner document verification status
router.get('/admin/doc-status/:ownerId', async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.ownerId).populate('documents');
    res.status(200).json({ success: true, documents: owner.documents });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get owner KYC status
router.get('/admin/kyc-status/:ownerId', async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.ownerId);
    res.status(200).json({ success: true, kycStatus: owner.kycStatus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;