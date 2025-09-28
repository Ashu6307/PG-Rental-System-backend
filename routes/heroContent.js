import express from 'express';
import HeroContent from '../models/HeroContent.js';

const router = express.Router();

// GET /api/hero-content
router.get('/', async (req, res) => {
  try {
    const hero = await HeroContent.findOne({ isDeleted: false });
    res.json(hero);
  } catch (err) {
    res.status(500).json({ error: 'Hero content fetch failed', details: err.message });
  }
});

export default router;
