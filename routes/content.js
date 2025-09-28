import express from 'express';
import Content from '../models/Content.js';
const router = express.Router();

// Get content by type and audience (public/user/owner)
router.get('/:type', async (req, res) => {
  const { type } = req.params;
  const audience = req.query.for || 'public';
  
  try {
    const content = await Content.findOne({ type, for: audience });
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Advanced content search/filter endpoint
router.post('/search', async (req, res) => {
  const { filters, sort, page, limit } = req.body;
  try {
    // TODO: Implement advanced search/filter logic
    // Example: Use MongoDB aggregation for flexible search
    const contents = await Content.aggregate([
      { $match: filters || {} },
      { $sort: sort || { createdAt: -1 } },
      { $skip: ((page || 1) - 1) * (limit || 20) },
      { $limit: limit || 20 },
    ]);
    res.status(200).json({ success: true, contents });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
