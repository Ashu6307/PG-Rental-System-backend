// adminReviewController.js
// Industry-level reviews/feedback controller for Admin Dashboard
const Review = require('../models/Review');

// List reviews/feedback (with filters)
exports.listReviews = async (req, res) => {
  try {
    const { status, user, dateFrom, dateTo } = req.query;
    const query = {};
    if (status) query.status = status;
    if (user) query.user = user;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    const reviews = await Review.find(query).populate('user').sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// Approve/reject review
exports.updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await Review.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update review status' });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
};
