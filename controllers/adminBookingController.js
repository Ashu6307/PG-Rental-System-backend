// adminBookingController.js
// Controller for admin booking management (view/filter/approve/cancel, industry-level)

const Booking = require('../models/Booking');

exports.listBookings = async (req, res) => {
  try {
    const { status, user, dateFrom, dateTo } = req.query;
    let query = { isDeleted: false };
    if (status) query.status = status;
    if (user) query.user = user;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    const bookings = await Booking.find(query).populate('user bike pg');
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.approveBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking || booking.isDeleted) return res.status(404).json({ success: false, message: 'Booking not found' });
    booking.status = 'approved';
    await booking.save();
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking || booking.isDeleted) return res.status(404).json({ success: false, message: 'Booking not found' });
    booking.status = 'cancelled';
    await booking.save();
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
