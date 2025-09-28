const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');

// Advanced issues search/filter endpoint
router.post('/search', async (req, res) => {
  const { filters, sort, page, limit } = req.body;
  try {
    // TODO: Implement advanced search/filter logic
    // Example: Use MongoDB aggregation for flexible search
    const issues = await Issue.aggregate([
      { $match: filters || {} },
      { $sort: sort || { createdAt: -1 } },
      { $skip: ((page || 1) - 1) * (limit || 20) },
      { $limit: limit || 20 },
    ]);
    res.status(200).json({ success: true, issues });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;