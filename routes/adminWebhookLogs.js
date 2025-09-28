// adminWebhookLogs.js
const express = require('express');
const router = express.Router();
const adminWebhookLogController = require('../controllers/adminWebhookLogController');

// List webhook logs
router.get('/', adminWebhookLogController.listWebhookLogs);
// Delete webhook log
router.delete('/:id', adminWebhookLogController.deleteWebhookLog);

module.exports = router;
