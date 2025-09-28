import express from 'express';
import CTAContent from '../models/CTAContent.js';

const router = express.Router();

// GET /api/cta-content
router.get('/', async (req, res) => {
  try {
    const cta = await CTAContent.findOne({ isDeleted: false });
    res.json(cta);
  } catch (err) {
    res.status(500).json({ error: 'CTA content fetch failed', details: err.message });
  }
});

export default router;
