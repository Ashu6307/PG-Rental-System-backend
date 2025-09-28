import express from 'express';
import BookingAction from '../models/BookingAction.js';
import Booking from '../models/Booking.js';
import { authenticateJWT, authorize } from '../middleware/auth.js';

const router = express.Router();

// Create booking action (cancel/reschedule)
router.post('/', authenticateJWT, authorize('user'), async (req, res) => {
  try {
    const { booking_id, action_type, reason } = req.body;
    // Validate booking exists
    const booking = await Booking.findById(booking_id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    // Create action
    const action = new BookingAction({
      booking_id,
      action_type,
      requested_by: req.user._id,
      reason
    });
    await action.save();
    res.status(201).json(action);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve/reject booking action
router.patch('/:id/approve', authenticateJWT, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const action = await BookingAction.findById(req.params.id);
    if (!action) return res.status(404).json({ error: 'Action not found' });
    action.status = status;
    action.approved_by = req.user._id;
    action.approval_date = new Date();
    await action.save();
    res.json(action);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get actions for a booking
router.get('/booking/:booking_id', verifyUser, async (req, res) => {
  try {
    const actions = await BookingAction.find({ booking_id: req.params.booking_id });
    res.json(actions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
