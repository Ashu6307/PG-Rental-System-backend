// notificationTestController.js
// Controller for push/email/SMS notification test/send (industry-level)

const notificationService = require('../utils/notificationService');

exports.sendTestNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, message } = req.body; // type: 'email' | 'sms' | 'push'
    let result;
    switch (type) {
      case 'email':
        result = await notificationService.sendEmail(userId, message);
        break;
      case 'sms':
        result = await notificationService.sendSMS(userId, message);
        break;
      case 'push':
        result = await notificationService.sendPush(userId, message);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid type' });
    }
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
