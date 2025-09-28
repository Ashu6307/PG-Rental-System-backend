import RateLimitFeedback from '../models/RateLimitFeedback.js';

// Get all rate limit feedbacks for owner
async function getFeedbacks(req, res) {
  try {
    const feedbacks = await RateLimitFeedback.find({ ownerId: req.owner._id }).sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
};

// Create new rate limit feedback
async function createFeedback(req, res) {
  try {
    const feedback = new RateLimitFeedback({ ...req.body, ownerId: req.owner._id });
    await feedback.save();
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create feedback' });
  }
};

// Update feedback status
async function updateFeedback(req, res) {
  try {
    const { id } = req.params;
    const update = req.body;
    const feedback = await RateLimitFeedback.findOneAndUpdate({ _id: id, ownerId: req.owner._id }, update, { new: true });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update feedback' });
  }
}

export default {
  getFeedbacks,
  createFeedback,
  updateFeedback
};
