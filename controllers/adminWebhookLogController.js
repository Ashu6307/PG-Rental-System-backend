// adminWebhookLogController.js
// Industry-level webhook logs controller for Admin Dashboard
const WebhookLog = require('../models/WebhookLog');

// List webhook logs (with filters)
exports.listWebhookLogs = async (req, res) => {
  try {
    const { event, status, user, dateFrom, dateTo } = req.query;
    const query = {};
    if (event) query.event = event;
    if (status) query.status = status;
    if (user) query.user = user;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    const logs = await WebhookLog.find(query).populate('user').sort({ createdAt: -1 });
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch webhook logs' });
  }
};

// Delete webhook log
exports.deleteWebhookLog = async (req, res) => {
  try {
    await WebhookLog.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete webhook log' });
  }
};
