// BookingAction controller for advanced logic, audit, analytics
import BookingAction from '../models/BookingAction.js';
import Booking from '../models/Booking.js';

export const createBookingAction = async (req, res) => {
  try {
    const { booking_id, action_type, reason } = req.body;
    const booking = await Booking.findById(booking_id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
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
};

export const approveBookingAction = async (req, res) => {
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
};

export const getBookingActions = async (req, res) => {
  try {
    const actions = await BookingAction.find({ booking_id: req.params.booking_id });
    res.json(actions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
