// rateLimitFeedbackController.js
// Controller for user rate limiting feedback (industry-level)

const RateLimitFeedback = require('../models/RateLimitFeedback');

exports.getUserRateLimitFeedback = async (req, res) => {
  try {
    const userId = req.user._id;
    const feedbacks = await RateLimitFeedback.find({ user: userId, isDeleted: false }).sort({ createdAt: -1 });
    res.json({ success: true, feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addRateLimitFeedback = async (req, res) => {
  try {
    const userId = req.user._id;
    const { endpoint, feedback } = req.body;
    const fb = new RateLimitFeedback({ user: userId, endpoint, feedback });
    await fb.save();
    res.status(201).json({ success: true, feedback: fb });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteRateLimitFeedback = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const fb = await RateLimitFeedback.findById(feedbackId);
    if (!fb) return res.status(404).json({ success: false, message: 'Feedback not found' });
    fb.isDeleted = true;
    await fb.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
