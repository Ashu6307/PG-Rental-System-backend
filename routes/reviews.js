import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import { sendNotification } from '../utils/notificationService.js';
import { logAction } from '../utils/auditLogService.js';

const router = express.Router();

router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { item_type, item_id, rating, comment } = req.body;
    // Check if user has booking for this item
    const booking = await Booking.findOne({ user_id: req.user.id, item_type, item_id, status: { $in: ['confirmed', 'completed'] } });
    if (!booking) {
      return res.status(403).json({ error: 'You can only review products you have booked.' });
    }
    const review = new Review({ user_id: req.user.id, item_type, item_id, rating, comment });
    await review.save();
    // Notification
    await sendNotification({
      userId: req.user.id,
      type: 'email',
      message: `Review submitted for ${item_type}`,
      channel: 'system',
      meta: { item_id, rating }
    });
    // Audit log
    await logAction({
      action: 'Review Created',
      performedBy: req.user.id,
      targetId: review._id,
      targetType: 'Review',
      details: { item_type, item_id, rating, comment }
    });
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Soft delete Review
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    review.status = 'deleted';
    await review.save();
    res.json({ message: 'Review soft deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Advanced review search/filter endpoint
router.post('/search', async (req, res) => {
  const { filters, sort, page, limit } = req.body;
  try {
    // TODO: Implement advanced search/filter logic
    // Example: Use MongoDB aggregation for flexible search
    const reviews = await Review.aggregate([
      { $match: filters || {} },
      { $sort: sort || { createdAt: -1 } },
      { $skip: ((page || 1) - 1) * (limit || 20) },
      { $limit: limit || 20 },
    ]);
    res.status(200).json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;