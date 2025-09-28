import express from 'express';
import Testimonial from '../models/Testimonial.js';

const router = express.Router();

// GET /api/testimonials
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isDeleted: false })
      .populate('user', 'name avatar');
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ error: 'Testimonials fetch failed', details: err.message });
  }
});

export default router;
