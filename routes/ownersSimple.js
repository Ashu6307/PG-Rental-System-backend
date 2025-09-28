import express from 'express';
const router = express.Router();

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

export default router;
