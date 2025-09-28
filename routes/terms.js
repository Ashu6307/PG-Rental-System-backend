const express = require('express');
const router = express.Router();
const Terms = require('../models/Terms');
const { authenticateJWT } = require('../middleware/auth');

// Get terms by type (pg_booking, room_booking, add_pg, add_room)
router.get('/:type', async (req, res) => {
  try {
    const terms = await Terms.findOne({ type: req.params.type }).sort({ version: -1 });
    if (!terms) return res.status(404).json({ error: 'Terms not found' });
    res.json({ content: terms.content, version: terms.version });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin update terms
router.post('/:type', authenticateJWT, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });
    const last = await Terms.findOne({ type: req.params.type }).sort({ version: -1 });
    const version = last ? last.version + 1 : 1;
    const terms = new Terms({
      type: req.params.type,
      content,
      version,
      updatedBy: req.user._id,
      updatedAt: new Date()
    });
    await terms.save();
    res.json({ success: true, terms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
