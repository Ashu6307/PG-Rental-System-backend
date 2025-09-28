import Booking from '../models/Booking.js';
import PG from '../models/PG.js';

// Get all bookings for owner's PGs
export const getOwnerBookings = async (req, res) => {
  try {
    // Find PGs owned by this owner
    const ownerId = req.user._id;
    const pgs = await PG.find({ owner: ownerId }, '_id');
    const pgIds = pgs.map(pg => pg._id);

    // Find bookings for these PGs
    const bookings = await Booking.find({
      item_type: 'PG', 
      item_id: { $in: pgIds }
    }).populate('user_id', 'name email').sort({ created_at: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Approve/Reject booking
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
