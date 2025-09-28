const express = require('express');
const router = express.Router();
const notificationTestController = require('../controllers/notificationTestController');
const auth = require('../middleware/auth');

// Send test notification (push/email/SMS)
router.post('/send', auth, notificationTestController.sendTestNotification);

module.exports = router;