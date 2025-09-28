import Review from '../models/Review.js';
import PG from '../models/PG.js';

// Get all reviews for owner's PGs
export const getOwnerReviews = async (req, res) => {
  try {
    // Find all PGs owned by this owner
    const pgs = await PG.find({ owner: req.user._id }).select('_id');
    const pgIds = pgs.map(pg => pg._id);
    
    // Find reviews for these PGs
    const reviews = await Review.find({
      item_type: 'PG', 
      item_id: { $in: pgIds }
    }).sort({ created_at: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Respond to a review (add comment)
export const respondToReview = async (req, res) => {
  try {
    const { response } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $set: { owner_response: response } },
      { new: true }
    );
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
