// Importing necessary modules and initializing router
const express = require('express');
const router = express.Router();
const Policy = require('../models/Policy');

// Advanced policy search/filter endpoint
router.post('/search', async (req, res) => {
  const { filters, sort, page, limit } = req.body;
  try {
    // TODO: Implement advanced search/filter logic
    // Example: Use MongoDB aggregation for flexible search
    const policies = await Policy.aggregate([
      { $match: filters || {} },
      { $sort: sort || { createdAt: -1 } },
      { $skip: ((page || 1) - 1) * (limit || 20) },
      { $limit: limit || 20 },
    ]);
    res.status(200).json({ success: true, policies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Create new policy
router.post('/admin/create', async (req, res) => {
  const { type, content, updatedBy } = req.body;
  try {
    const policy = await Policy.create({ type, content, updatedBy });
    res.status(201).json({ success: true, policy });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Update policy
router.put('/admin/update/:id', async (req, res) => {
  const { content, updatedBy } = req.body;
  try {
    const policy = await Policy.findByIdAndUpdate(
      req.params.id,
      { content, lastUpdated: Date.now(), $inc: { version: 1 }, updatedBy },
      { new: true }
    );
    res.status(200).json({ success: true, policy });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all policies (by type/version)
router.get('/list', async (req, res) => {
  const { type, version } = req.query;
  try {
    const query = {};
    if (type) query.type = type;
    if (version) query.version = Number(version);
    const policies = await Policy.find(query);
    res.status(200).json({ success: true, policies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Exporting the router to be used in other parts of the application
module.exports = router;