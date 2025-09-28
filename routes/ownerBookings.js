import express from 'express';
import { getOwnerBookings, updateBookingStatus } from '../controllers/ownerBookingController.js';
import { ownerAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all bookings for owner's PGs/Rooms
router.get('/', ownerAuth, getOwnerBookings);
// Approve/Reject/Complete booking
router.put('/:id', ownerAuth, updateBookingStatus);

export default router;
