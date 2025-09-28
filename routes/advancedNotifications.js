// advancedNotifications.js
const express = require('express');
const router = express.Router();
const advancedNotificationController = require('../controllers/advancedNotificationController');

// Send advanced notification
router.post('/send', advancedNotificationController.sendAdvancedNotification);
// List advanced notifications
router.get('/', advancedNotificationController.listAdvancedNotifications);

module.exports = router;
