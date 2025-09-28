// adminNotificationPreferencesController.js
// Industry-level notification preferences controller for Admin Dashboard
const NotificationPreference = require('../models/NotificationPreference');

// List notification preferences (with filters)
exports.listPreferences = async (req, res) => {
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
    const preferences = await NotificationPreference.find(query).populate('user').sort({ createdAt: -1 });
    res.json({ preferences });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
};

// Update notification preference
exports.updatePreference = async (req, res) => {
  try {
    const { channel, status } = req.body;
    await NotificationPreference.findByIdAndUpdate(req.params.id, { channel, status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification preference' });
  }
};

// Delete notification preference
exports.deletePreference = async (req, res) => {
  try {
    await NotificationPreference.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete notification preference' });
  }
};
