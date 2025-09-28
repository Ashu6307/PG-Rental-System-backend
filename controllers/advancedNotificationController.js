// advancedNotificationController.js
// Industry-level advanced notification channels (email, SMS, push) controller
const Notification = require('../models/Notification');
const notificationService = require('../utils/notificationService');

// Send notification via selected channel
exports.sendAdvancedNotification = async (req, res) => {
  try {
    const { userId, title, message, channel, meta } = req.body;
    let result = {};
    result = await notificationService.send(userId, title, message, channel, meta);
    await Notification.create({ user: userId, title, message, channel, status: result.success ? 'sent' : 'failed', details: result });
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

// List sent notifications
exports.listAdvancedNotifications = async (req, res) => {
  try {
    const { user, channel, status, dateFrom, dateTo } = req.query;
    const query = {};
    if (user) query.user = user;
    if (channel) query.channel = channel;
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};
