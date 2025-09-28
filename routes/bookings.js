import express from 'express';
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import { generateInvoicePDFBuffer } from '../utils/invoicePDF.js';
import { authenticateJWT } from '../middleware/auth.js';
// Enhanced Email System Import
import EmailManager from '../modules/email/EmailManager.js';
const router = express.Router();

// Get user bookings (for /api/bookings)
router.get('/', authenticateJWT, async (req, res) => {
  try {
    // TODO: Implement booking retrieval from database
    // For now, return empty array as placeholder
    const bookings = [];
    res.status(200).json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create Booking
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.data_consent) {
      return res.status(403).json({ error: 'You must accept Terms & Conditions before booking.' });
    }
    const booking = new Booking({
      ...req.body,
      user_id: req.user.id
    });
    await booking.save();
    // Create invoice
    const invoice = new Invoice({
      invoiceId: `INV${Date.now()}`,
      bookingId: booking._id.toString(),
      user: user._id,
      itemType: booking.item_type,
      itemName: booking.item_name,
      itemAddress: booking.item_address,
      startDate: booking.start_date,
      endDate: booking.end_date,
      amount: booking.amount,
      gst: booking.gst,
      paymentStatus: 'paid',
      details: booking,
      header: '',
      footer: ''
    });
    await invoice.save();
    // Generate PDF for attachment
    const pdfBuffer = await generateInvoicePDFBuffer({ ...invoice.toObject(), user });
    
    // Send booking request confirmation email using Enhanced Email Manager
    await EmailManager.sendBookingEmail(
      user,
      booking,
      'booking_request',
      {}, // additional data
      {
        useQueue: true, // Use email queue for better performance
        attachmentBuffer: pdfBuffer // Attach invoice PDF
      }
    );
    // Notification
    await sendNotification({
      userId: req.user.id,
      type: 'email',
      message: `Booking created for ${req.body.item_type}`,
      channel: 'system',
      meta: req.body
    });
    // Audit log
    await logAction({
      action: 'Booking Created',
      performedBy: req.user.id,
      targetId: booking._id,
      targetType: 'Booking',
      details: req.body
    });
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Get all Bookings (admin/owner)
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Get Booking by ID
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Update Booking (cancel/complete)
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    // If booking is cancelled, update invoice and send cancelled PDF
    if (req.body.status === 'cancelled') {
      const invoice = await Invoice.findOne({ bookingId: booking._id.toString() });
      if (invoice) {
        invoice.paymentStatus = 'failed';
        invoice.header = 'Cancelled Invoice';
        await invoice.save();
        const user = await User.findById(booking.user_id);
        const pdfBuffer = await generateInvoicePDFBuffer({ ...invoice.toObject(), user });
        
        // Use professional template for cancellation email
        const emailContent = emailTemplates.notification(
          'Booking Cancelled',
          `Your booking has been cancelled successfully. We've attached your cancellation invoice for your records. If you have any questions, please don't hesitate to contact our support team.`,
          user.name || user.username || 'Customer'
        );
        
        await sendEmail({ 
          to: user.email, 
          subject: '❌ Booking Cancelled - Invoice Attached - Property Rental Pro', 
          html: emailContent, 
          attachmentBuffer: pdfBuffer 
        });
      }
    }
    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Duplicate import block removed
// Soft delete Booking
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    booking.status = 'deleted';
    await booking.save();
    res.json({ message: 'Booking soft deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
// Advanced booking search/filter endpoint
router.post('/search', async (req, res) => {
  const { filters, sort, page, limit } = req.body;
  try {
    // TODO: Implement advanced search/filter logic
    // Example: Use MongoDB aggregation for flexible search
    const bookings = await Booking.aggregate([
      { $match: filters || {} },
      { $sort: sort || { createdAt: -1 } },
      { $skip: ((page || 1) - 1) * (limit || 20) },
      { $limit: limit || 20 },
    ]);
    res.status(200).json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});