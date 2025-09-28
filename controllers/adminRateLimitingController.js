// adminRateLimitingController.js
// Industry-level rate limiting controller for Admin Dashboard
const RateLimitLog = require('../models/RateLimitLog');

// List rate limit logs (with filters)
exports.listRateLimitLogs = async (req, res) => {
  try {
    const { user, endpoint, status, dateFrom, dateTo } = req.query;
    const query = {};
    if (user) query.user = user;
    if (endpoint) query.endpoint = endpoint;
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    const logs = await RateLimitLog.find(query).populate('user').sort({ createdAt: -1 });
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rate limit logs' });
  }
};

// Delete rate limit log
exports.deleteRateLimitLog = async (req, res) => {
  try {
    await RateLimitLog.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete rate limit log' });
  }
};
