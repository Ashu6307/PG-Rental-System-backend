import express from 'express';
import FooterContent from '../models/FooterContent.js';

const router = express.Router();

// GET /api/footer - Get footer content
router.get('/', async (req, res) => {
  try {
    const footer = await FooterContent.findOne({ isDeleted: false });
    res.json(footer);
  } catch (err) {
    res.status(500).json({ error: 'Footer content fetch failed', details: err.message });
  }
});

export default router;
