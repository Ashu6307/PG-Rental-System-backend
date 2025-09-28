import express from 'express';
import FeaturedListing from '../models/FeaturedListing.js';

const router = express.Router();

// GET /api/featured-listings
router.get('/', async (req, res) => {
  try {
    const listings = await FeaturedListing.find({ isDeleted: false, isFeatured: true })
      .populate('refId');
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: 'Featured listings fetch failed', details: err.message });
  }
});

export default router;
