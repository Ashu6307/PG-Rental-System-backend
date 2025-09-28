// adminAnalytics.js
const express = require('express');
const router = express.Router();
const adminAnalyticsController = require('../controllers/adminAnalyticsController');

// Get analytics dashboard data
router.get('/', adminAnalyticsController.getAnalytics);

module.exports = router;
