// adminNotifications.js
const express = require('express');
const router = express.Router();
const adminNotificationController = require('../controllers/adminNotificationController');

// List notifications
router.get('/', adminNotificationController.listNotifications);
// Send notification
router.post('/send', adminNotificationController.sendNotification);
// List templates
router.get('/templates', adminNotificationController.listTemplates);
// Delete notification
router.delete('/:id', adminNotificationController.deleteNotification);
// Test notification
router.post('/test', adminNotificationController.testNotification);

module.exports = router;
