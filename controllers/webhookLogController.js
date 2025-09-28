// webhookLogController.js
// Controller for user webhook logs

const WebhookLog = require('../models/WebhookLog');

exports.getUserWebhookLogs = async (req, res) => {
  try {
    const userId = req.user._id;
    const logs = await WebhookLog.find({ user: userId, isDeleted: false }).sort({ createdAt: -1 });
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteWebhookLog = async (req, res) => {
  try {
    const logId = req.params.id;
    const log = await WebhookLog.findById(logId);
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
    log.isDeleted = true;
    await log.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
