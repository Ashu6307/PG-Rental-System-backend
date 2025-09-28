// ...existing code...
const express = require('express');
const router = express.Router();
const adminBookingController = require('../controllers/adminBookingController');
const adminAuth = require('../middleware/adminAuth');

// List bookings with filters
router.get('/', adminAuth, adminBookingController.listBookings);
// Approve booking
router.post('/approve/:id', adminAuth, adminBookingController.approveBooking);
// Cancel booking
router.post('/cancel/:id', adminAuth, adminBookingController.cancelBooking);

module.exports = router;
// ...existing code...
