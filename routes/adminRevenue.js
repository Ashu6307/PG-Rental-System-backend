// ...existing code...
const express = require('express');
const router = express.Router();
const adminRevenueController = require('../controllers/adminRevenueController');
const adminAuth = require('../middleware/adminAuth');

// Get revenue analytics
router.get('/analytics', adminAuth, adminRevenueController.getRevenueAnalytics);

module.exports = router;
// ...existing code...
